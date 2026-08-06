#!/usr/bin/env python3

"""
Get the output URI from the bssh-to-aws-s3 workflow run for a given instrument run ID.

Queries the workflow manager for bssh-to-aws-s3 workflow runs in SUCCEEDED state,
finds the one where data.tags.instrumentRunId matches, and returns
data.engineParameters.outputUri.
"""

# Standard imports
import logging
from typing import Dict, Any

# Layer imports
from orcabus_api_tools.workflow import (
    list_workflow_runs,
    get_latest_payload_from_workflow_run,
)

# Logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Constants
BSSH_TO_AWS_S3_WORKFLOW_NAME = "bssh-to-aws-s3"
SUCCEEDED_STATUS = "SUCCEEDED"


def handler(event: Dict[str, Any], context) -> Dict[str, str]:
    """
    Get the output URI from the bssh-to-aws-s3 workflow for a given instrument run ID.

    Expected event:
    {
        "instrumentRunId": "<instrument_run_id>"
    }

    Returns:
    {
        "outputUri": "s3://..."
    }
    """

    # Get inputs
    instrument_run_id = event["instrumentRunId"]

    logger.info(
        f"Searching for SUCCEEDED bssh-to-aws-s3 workflow run "
        f"for instrument run '{instrument_run_id}'..."
    )

    # List all SUCCEEDED bssh-to-aws-s3 workflow runs
    workflow_runs = list_workflow_runs(
        workflow_name=BSSH_TO_AWS_S3_WORKFLOW_NAME,
        current_status=SUCCEEDED_STATUS,
    )

    logger.info(f"Found {len(workflow_runs)} SUCCEEDED bssh-to-aws-s3 workflow runs")

    # Find the workflow run with matching instrumentRunId in tags
    for workflow_run in workflow_runs:
        workflow_run_orcabus_id = workflow_run["orcabusId"]

        # Get the payload for this workflow run
        payload = get_latest_payload_from_workflow_run(
            workflow_run_orcabus_id=workflow_run_orcabus_id
        )

        if payload is None:
            continue

        # Check if the instrument run ID matches in tags
        tags = payload.get("data", {}).get("tags", {})
        if tags.get("instrumentRunId") == instrument_run_id:
            # Found the matching workflow run - return the outputUri
            output_uri = payload["data"]["engineParameters"]["outputUri"]
            logger.info(
                f"Found matching workflow run '{workflow_run_orcabus_id}' "
                f"with outputUri: {output_uri}"
            )
            return {
                "outputUri": output_uri,
            }

    raise ValueError(
        f"Could not find a SUCCEEDED bssh-to-aws-s3 workflow run "
        f"for instrument run '{instrument_run_id}'"
    )
