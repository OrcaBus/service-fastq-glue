#!/usr/bin/env python3

"""
Delete BaseSpace Sequence Hub run data for a given instrument run ID.

Uses the BaseSpace REST API (v1pre3) to:
1. Find the run by instrument run ID
2. Move the run to trash
3. Empty the trash to permanently free storage

API Reference: https://developer.basespace.illumina.com/docs/content/documentation/rest-api/v1-api-reference
"""

# Standard imports
import logging
from os import environ
from typing import Dict, Optional

# Third-party imports
import boto3
import requests

# Logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variable names
BASESPACE_API_SERVER_SSM_PARAMETER_PATH_ENV_VAR = "BASESPACE_API_SERVER_SSM_PARAMETER_PATH"
BASESPACE_ACCESS_TOKEN_SECRETS_MANAGER_PATH_ENV_VAR = "BASESPACE_ACCESS_TOKEN_SECRETS_MANAGER_PATH"  # pragma: allowlist secret


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


def get_basespace_run_id_from_instrument_run_id(
        instrument_run_id: str,
        api_server: str,
        access_token: str,
) -> Optional[str]:
    """
    Given an instrument run ID, find the corresponding BaseSpace run ID
    by paginating through all runs.
    Uses GET /v1pre3/users/current/runs
    """
    offset = 0
    limit = 100
    total_count = 1  # Initialize to enter the loop

    while offset < total_count:
        response = requests.get(
            url=f"https://{api_server}/v1pre3/users/current/runs",
            headers={"x-access-token": access_token},
            params={
                "SortBy": "Id",
                "Limit": limit,
                "Offset": offset,
            },
        )
        response.raise_for_status()
        response_json = response.json()

        # Update total count from response
        total_count = response_json["Response"]["TotalCount"]

        # Search for the run by name in this page
        for run in response_json["Response"]["Items"]:
            if run["Name"] == instrument_run_id:
                return run["Id"]

        offset += limit

    # Not found
    return None


def get_num_files_from_basespace_run_id(
        basespace_run_id: str,
        api_server: str,
        access_token: str,
) -> int:
    """
    Given a BaseSpace run ID, get the total number of files.
    Uses GET /v1pre3/runs/{id}/files with Limit=0 to just get TotalCount.
    """
    response = requests.get(
        url=f"https://{api_server}/v1pre3/runs/{basespace_run_id}/files",
        headers={"x-access-token": access_token},
        params={"Limit": 0},
    )
    response.raise_for_status()

    return response.json()["Response"]["TotalCount"]


def delete_basespace_run(
        basespace_run_id: str,
        api_server: str,
        access_token: str,
) -> None:
    """
    Given a BaseSpace run ID, move the run to trash.
    Uses DELETE /v1pre3/runs/{id}
    """
    response = requests.delete(
        url=f"https://{api_server}/v1pre3/runs/{basespace_run_id}",
        headers={"x-access-token": access_token},
    )
    response.raise_for_status()


def empty_basespace_trash(
        api_server: str,
        access_token: str,
) -> None:
    """
    Empty the trash to permanently delete run data and save storage costs.
    Uses DELETE /v1pre3/users/current/trash
    """
    response = requests.delete(
        url=f"https://{api_server}/v1pre3/users/current/trash",
        headers={"x-access-token": access_token},
    )
    response.raise_for_status()


def handler(event, context) -> Dict[str, str]:
    """
    Delete BaseSpace run data for a given instrument run ID.

    Expected event:
    {
        "instrumentRunId": "<instrument_run_id>"
    }
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

    # Get basespace run id
    logger.info(f"Searching for instrument run '{instrument_run_id}' in BaseSpace...")
    basespace_run_id = get_basespace_run_id_from_instrument_run_id(
        instrument_run_id=instrument_run_id,
        api_server=basespace_api_server,
        access_token=basespace_access_token,
    )

    if basespace_run_id is None:
        raise ValueError(
            f"Could not find BaseSpace run ID for instrument run '{instrument_run_id}'"
        )

    logger.info(f"Found BaseSpace run ID '{basespace_run_id}' for instrument run '{instrument_run_id}'")

    # Log number of files in the run
    num_files = get_num_files_from_basespace_run_id(
        basespace_run_id=basespace_run_id,
        api_server=basespace_api_server,
        access_token=basespace_access_token,
    )
    logger.info(f"Run '{basespace_run_id}' contains {num_files} files")

    # Delete the basespace run
    logger.info(f"Deleting BaseSpace run '{basespace_run_id}'...")
    delete_basespace_run(
        basespace_run_id=basespace_run_id,
        api_server=basespace_api_server,
        access_token=basespace_access_token,
    )

    # Empty the trash
    logger.info("Emptying BaseSpace trash...")
    empty_basespace_trash(
        api_server=basespace_api_server,
        access_token=basespace_access_token,
    )

    logger.info(f"Successfully deleted BaseSpace data for instrument run '{instrument_run_id}'")

    return {
        "instrumentRunId": instrument_run_id,
        "basespaceRunId": basespace_run_id,
    }
