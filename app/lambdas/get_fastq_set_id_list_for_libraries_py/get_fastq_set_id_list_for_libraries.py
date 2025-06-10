#!/usr/bin/env python3

"""
Get the fastq set id for a list of libraries.

Inputs:
  * libraryIdList,
  * instrumentRunId

Outputs:
  * fastqSetIdList
"""

from orcabus_api_tools.fastq import get_fastqs_in_libraries_and_instrument_run_id


def handler(event, context):
    """
    Get the library id list and instrument run id
    :param event:
    :param context:
    :return:
    """
    fastq_set_ids = get_fastqs_in_libraries_and_instrument_run_id(
        library_id_list=event.get("libraryIdList", []),
        instrument_run_id=event.get("instrumentRunId", None)
    )

    return {
        "fastqSetIdList": fastq_set_ids
    }
