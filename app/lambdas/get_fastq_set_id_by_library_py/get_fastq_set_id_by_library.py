#!/usr/bin/env python3

"""
Given a library id, return the latest fastq set id associated with that library.

If no current fastq set exists for the library, returns {"fastqSetId": None}.
"""

# Layer imports
from orcabus_api_tools.fastq import get_fastq_sets


def handler(event, context):

    # Set inputs
    library_id = event["libraryId"]

    # Get fastq set
    try:
        fastq_set = next(iter(get_fastq_sets(
            library=library_id,
            currentFastqSet=True
        )))
    except StopIteration:
        # No current fastq set for this library, return None so the caller can skip it
        return {
            "fastqSetId": None
        }

    return {
        "fastqSetId": fastq_set['id']
    }
