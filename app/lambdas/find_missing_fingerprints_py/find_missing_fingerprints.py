#!/usr/bin/env python3

"""
Find missing fingerprints

Given an instrument run id, query the fastq manager for
fastq set IDs missing somalier fingerprints.
"""

# Standard imports
from typing import List, Dict

# Layers
from orcabus_api_tools.fastq import (
    get_fastqs_in_instrument_run_id,
    get_fastq_set
)


def handler(event, context) -> Dict[str, List[str]]:
    """
    Find missing fingerprints
    """

    # Get inputs
    instrument_run_id = event['instrumentRunId']

    # Get fastq sets
    fastq_set_id_list = list(set(
        list(filter(
            lambda fastq_iter_map_: fastq_iter_map_ is not None,
            list(map(
                lambda fastq_iter_: (
                    fastq_iter_.get('fastqSetId')
                    if fastq_iter_.get('fastqSetId')
                    else None
                ),
                get_fastqs_in_instrument_run_id(instrument_run_id),
            ))
        ))
    ))

    # Filter to just those with a missing somalier entry
    fastq_set_id_with_missing_fingerprints = []
    for fastq_set_id_iter_ in fastq_set_id_list:
        if get_fastq_set(fastq_set_id_iter_).get('somalier') is None:
            fastq_set_id_with_missing_fingerprints.append(fastq_set_id_iter_)

    return {
        "fastqSetIdList": fastq_set_id_with_missing_fingerprints
    }
