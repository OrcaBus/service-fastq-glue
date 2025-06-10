#!/usr/bin/env python3

"""
Get fastq list rows from a fastq set id

Inputs:
  - fastqSetId

Outputs:
  - fastqListRows

Each fastqListRow is a dictionary with the following
  - fqlrDict - the toFastqListRows api endpoint for a given fastq list orw
  - library - the library / orcabus id pairing
"""

from orcabus_api_tools.fastq import (
    to_fastq_list_rows,
    get_fastq_set
)


def handler(event, context):
    """
    Get fastq list rows from a fastq set id

    Then return the fastq list rows in a dictionary and append the library to each object
    :param event:
    :param context:
    :return:
    """

    fastq_set_id = event.get("fastqSetId")
    fastq_set_object = get_fastq_set(fastq_set_id=fastq_set_id)
    fastq_list_rows = to_fastq_list_rows(
        fastq_set_id=fastq_set_id
    )

    return {
        "fqlrDict": fastq_list_rows,
        "library": fastq_set_object['library']
    }
