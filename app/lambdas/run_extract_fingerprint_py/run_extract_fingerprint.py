#!/usr/bin/env python3

"""
Given a fastq set id, reference name, and a bam uri, run the extract api to extract the fingerprint

We do not expect a response since this is run asynchronously (and takes around 30 minutes to complete)
"""

# Layer imports
from orcabus_api_tools.fastq import run_extract_fingerprint


def handler(event, context):
    """
    Launch extract fingerprint job
    :param event:
    :param context:
    :return:
    """

    fastq_set_id = event['fastqSetId']
    reference_name = event['referenceName']
    bam_uri = event['bamUri']

    run_extract_fingerprint(
        fastq_set_id=fastq_set_id,
        reference_name=reference_name,
        bam_uri=bam_uri
    )

    return {}
