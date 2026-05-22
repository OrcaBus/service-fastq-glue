#!/usr/bin/env python3

"""
Get fastq and fastq set ids from instrument run id
"""

# Standard imports
from typing import TypedDict, List, cast

# Orcabus tools
from orcabus_api_tools.fastq import get_fastqs_in_instrument_run_id


# Classes
class ResponseDict(TypedDict):
    fastqId: str
    fastqSetId: str


def handler(event, context) -> List[ResponseDict]:
    """
    Get fastq and fastq set ids from instrument run id
    """
    # Get inputs
    instrument_run_id = event['instrumentRunId']

    # Get fastq list
    fastq_list = get_fastqs_in_instrument_run_id(instrument_run_id)

    return list(map(
        lambda fastq_iter_: cast(
            ResponseDict,
            cast(
                object,
                {
                    'fastqId': fastq_iter_['id'],
                    'fastqSetId': fastq_iter_['fastqSetId']
                }
            )
        ),
        fastq_list,
    ))
