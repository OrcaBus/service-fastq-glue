#!/usr/bin/env python3

"""
Get the archive destination URI for a given instrument run ID.

Queries the SRM API to get the sequencing run start time, then constructs
the archive destination URI in the format:
  s3://{archive_bucket}/v1/year={year}/month={month}/
"""

# Standard imports
import logging
from os import environ
from datetime import datetime
from typing import Dict, Any

# Layer imports
from orcabus_api_tools.sequence import get_sequence_object_from_instrument_run_id

# Logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variable names
ARCHIVE_BUCKET_ENV_VAR = "ARCHIVE_BUCKET"


def handler(event: Dict[str, Any], context) -> Dict[str, str]:
    """
    Get the archive destination URI for a given instrument run ID.

    Expected event:
    {
        "instrumentRunId": "<instrument_run_id>"
    }

    Returns:
    {
        "destinationUri": "s3://{archive_bucket}/v1/year={year}/month={month}/"
    }
    """

    # Get inputs
    instrument_run_id = event["instrumentRunId"]
    archive_bucket = environ[ARCHIVE_BUCKET_ENV_VAR]

    logger.info(
        f"Getting archive destination URI for instrument run '{instrument_run_id}'"
    )

    # Get the sequence run object to obtain the start time
    sequence_run = get_sequence_object_from_instrument_run_id(
        instrument_run_id=instrument_run_id
    )

    if sequence_run is None:
        raise ValueError(
            f"Could not find sequence run for instrument run '{instrument_run_id}'"
        )

    # Parse the start time to extract year and month
    start_time_str = sequence_run["startTime"]
    start_time = datetime.fromisoformat(start_time_str)
    year = start_time.year
    month = start_time.month

    # Construct the destination URI
    destination_uri = f"s3://{archive_bucket}/v1/year={year}/month={month:02d}/"

    logger.info(
        f"Archive destination URI for instrument run '{instrument_run_id}': {destination_uri}"
    )

    return {
        "destinationUri": destination_uri,
    }
