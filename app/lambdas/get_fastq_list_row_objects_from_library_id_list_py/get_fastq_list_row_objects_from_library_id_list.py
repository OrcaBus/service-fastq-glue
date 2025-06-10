#!/usr/bin/env python3

"""
Get the fastq list row objects from a list of library IDs.

Inputs:
  * instrumentRunId
  * libraryIdList

Outputs:
  * fastqListRowObjectsList
"""

from orcabus_api_tools.fastq import get_fastqs_in_libraries_and_instrument_run_id


def handler(event, context):
    """
    Get fastqs from library list
    :param event:
    :param context:
    :return:
    """

    return {
        "fastqListRowObjectsList": get_fastqs_in_libraries_and_instrument_run_id(
            library_id_list=event.get("libraryIdList"),
            instrument_run_id=event.get("instrumentRunId")
        )
    }
