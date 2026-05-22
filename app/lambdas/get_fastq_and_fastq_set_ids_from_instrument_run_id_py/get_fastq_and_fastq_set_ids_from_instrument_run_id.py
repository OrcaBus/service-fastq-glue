#!/usr/bin/env python3

"""
Get fastq and fastq set ids from instrument run id
"""

# Standard imports
from typing import TypedDict, Dict, List, cast

# Orcabus tools
from orcabus_api_tools.fastq import get_fastqs_in_instrument_run_id


# Classes
class ResponseDict(TypedDict):
    fastqId: str
    fastqSetId: str


def handler(event, context) -> Dict[str, List[ResponseDict]]:
    """
    Get fastq and fastq set ids from instrument run id
    """
    # Get inputs
    instrument_run_id = event['instrumentRunId']

    # Get fastq list
    fastq_list = get_fastqs_in_instrument_run_id(instrument_run_id)

    fastq_id_and_fastq_set_id_pairs: List[ResponseDict] = list(map(
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

    return {
        "fastqAndFastqSetIdPairs": fastq_id_and_fastq_set_id_pairs
    }
