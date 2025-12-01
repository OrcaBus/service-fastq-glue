#!/usr/bin/env python3

"""
Given a library id, return the latest fastq set id associated with that library.
"""

# Layer imports
from orcabus_api_tools.fastq import get_fastq_sets


def handler(event, context):

    # Set inputs
    library_id = event["library_id"]

    # Get fastq set
    fastq_set = next(iter(get_fastq_sets(
        library=library_id,
        currentFastqSet=True
    )))

    return {
        "fastqSetId": fastq_set['id']
    }
