#!/usr/bin/env python3

"""
Get the list of lanes on an instrument run.

Given an instrument run id, this lambda:

1. Resolves the BaseSpace v1pre3Id via the OrcaBus sequence run endpoint
   (api/v1/sequence/<instrument_run_id>/sequence_run).
2. Uses the BaseSpace REST API (v1pre3) to find the RunInfo.xml file id for the run.
3. Downloads and parses the RunInfo.xml file.
4. Reads the RunInfo.Run.FlowcellLayout LaneCount attribute (an integer in string format).
5. Returns the list of lanes as a 1-based count up to (and including) the LaneCount value.

Expected event:
{
    "instrumentRunId": "<instrument_run_id>"
}

Returns:
{
    "laneList": [1, 2, ...]
}

API Reference: https://developer.basespace.illumina.com/docs/content/documentation/rest-api/v1-api-reference
"""

# Standard imports
import logging
from os import environ
from typing import Dict, List, Optional
from xml.etree import ElementTree as ET

# Third-party imports
import boto3
import requests

# Layer imports
from orcabus_api_tools.sequence import get_sequence_object_from_instrument_run_id

# Logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variable names
BASESPACE_API_SERVER_SSM_PARAMETER_PATH_ENV_VAR = "BASESPACE_API_SERVER_SSM_PARAMETER_PATH"
BASESPACE_ACCESS_TOKEN_SECRETS_MANAGER_PATH_ENV_VAR = "BASESPACE_ACCESS_TOKEN_SECRETS_MANAGER_PATH"  # pragma: allowlist secret

RUN_INFO_FILE_NAME = "RunInfo.xml"


def get_ssm_parameter_value(ssm_parameter_path: str) -> str:
    """
    Given an SSM parameter path, get the value from AWS SSM Parameters
    """
    ssm_client = boto3.client("ssm")
    return ssm_client.get_parameter(
        Name=ssm_parameter_path,
        WithDecryption=True,
    )["Parameter"]["Value"]


def get_secret_value(secret_path: str) -> str:
    """
    Given a secrets path, get the value from AWS Secrets Manager
    """
    secrets_client = boto3.client("secretsmanager")
    return secrets_client.get_secret_value(
        SecretId=secret_path,
    )["SecretString"]


def get_v1pre3_id_from_instrument_run_id(instrument_run_id: str) -> str:
    """
    Given an instrument run id, resolve the BaseSpace v1pre3Id via the
    OrcaBus sequence run endpoint.
    """
    sequence_run_object = get_sequence_object_from_instrument_run_id(
        instrument_run_id=instrument_run_id
    )

    if sequence_run_object is None:
        raise ValueError(
            f"Could not find sequence run for instrument run id '{instrument_run_id}'"
        )

    v1pre3_id = sequence_run_object.get("v1pre3Id")
    if not v1pre3_id:
        raise ValueError(
            f"Could not find v1pre3Id for instrument run id '{instrument_run_id}'"
        )

    return v1pre3_id


def get_run_info_file_id(
        v1pre3_id: str,
        api_server: str,
        access_token: str,
) -> str:
    """
    Given a BaseSpace run id (v1pre3Id), find the file id of the RunInfo.xml file.
    Uses GET /v1pre3/runs/{id}/files
    """
    response = requests.get(
        url=f"https://{api_server}/v1pre3/runs/{v1pre3_id}/files",
        headers={"x-access-token": access_token},
        params={"Extensions": ".xml", "Limit": 1024},
    )
    response.raise_for_status()

    run_info_file: Optional[Dict] = next(
        filter(
            lambda file_iter_: file_iter_["Name"] == RUN_INFO_FILE_NAME,
            response.json()["Response"]["Items"],
        ),
        None,
    )

    if run_info_file is None:
        raise ValueError(
            f"Could not find '{RUN_INFO_FILE_NAME}' file for BaseSpace run id '{v1pre3_id}'"
        )

    return run_info_file["Id"]


def get_run_info_xml_content(
        file_id: str,
        api_server: str,
        access_token: str,
) -> str:
    """
    Given a BaseSpace file id, download the file content.
    Uses GET /v1pre3/files/{id}/content
    """
    response = requests.get(
        url=f"https://{api_server}/v1pre3/files/{file_id}/content",
        headers={"x-access-token": access_token},
    )
    response.raise_for_status()
    return response.text


def get_lane_count_from_run_info_xml(run_info_xml: str) -> int:
    """
    Parse the RunInfo.xml content and return the LaneCount value as an integer.
    The LaneCount lives on the RunInfo.Run.FlowcellLayout element.
    """
    root = ET.fromstring(run_info_xml)

    flowcell_layout = root.find("./Run/FlowcellLayout")
    if flowcell_layout is None:
        raise ValueError("Could not find Run.FlowcellLayout element in RunInfo.xml")

    lane_count = flowcell_layout.get("LaneCount")
    if lane_count is None:
        raise ValueError("Could not find LaneCount attribute in Run.FlowcellLayout element")

    return int(lane_count)


def handler(event, context) -> Dict[str, List[int]]:
    """
    Get the list of lanes on an instrument run.
    :param event: {"instrumentRunId": "<instrument_run_id>"}
    :param context: Lambda context
    :return: {"laneList": [1, 2, ...]}
    """
    # Get inputs
    instrument_run_id = event["instrumentRunId"]

    # Get BaseSpace credentials from AWS
    basespace_api_server = get_ssm_parameter_value(
        environ[BASESPACE_API_SERVER_SSM_PARAMETER_PATH_ENV_VAR]
    )
    basespace_access_token = get_secret_value(
        environ[BASESPACE_ACCESS_TOKEN_SECRETS_MANAGER_PATH_ENV_VAR]
    )

    # Resolve the BaseSpace v1pre3Id from the instrument run id
    logger.info(f"Resolving v1pre3Id for instrument run '{instrument_run_id}'...")
    v1pre3_id = get_v1pre3_id_from_instrument_run_id(instrument_run_id)
    logger.info(f"Found v1pre3Id '{v1pre3_id}' for instrument run '{instrument_run_id}'")

    # Find the RunInfo.xml file id
    run_info_file_id = get_run_info_file_id(
        v1pre3_id=v1pre3_id,
        api_server=basespace_api_server,
        access_token=basespace_access_token,
    )
    logger.info(f"Found '{RUN_INFO_FILE_NAME}' file id '{run_info_file_id}'")

    # Download and parse the RunInfo.xml file
    run_info_xml = get_run_info_xml_content(
        file_id=run_info_file_id,
        api_server=basespace_api_server,
        access_token=basespace_access_token,
    )
    lane_count = get_lane_count_from_run_info_xml(run_info_xml)
    logger.info(f"Instrument run '{instrument_run_id}' has {lane_count} lane(s)")

    # Return the list of lanes as a 1-based count up to (and including) lane_count
    return {
        "laneList": list(range(1, lane_count + 1)),
    }
