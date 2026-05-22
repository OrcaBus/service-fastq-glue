#!/usr/bin/env python3

"""
Unlink fastq from fastq set
"""

# Orcabus imports
from orcabus_api_tools.fastq import unlink_fastq_from_fastq_set


def handler(event, context):
    """
    Unlink fastq from fastq set
    """
    # Get inputs
    fastq_set_id = event["fastqSetId"]
    fastq_id = event["fastqId"]

    # Unlink fastq from fastq sets
    unlink_fastq_from_fastq_set(
        fastq_id=fastq_id,
        fastq_set_id=fastq_set_id,
    )
