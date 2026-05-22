#!/usr/bin/env python3

"""
Invalidate a fastq file
"""


# Orcabus imports
from orcabus_api_tools.fastq import invalidate_fastq


def handler(event, context) -> None:
    """
    Invalidate a fastq file
    """

    # Get inputs
    fastq_id = event.get("fastqId")

    invalidate_fastq(fastq_id)
