#!/usr/bin/env python3

"""
Get the fastq objects from the library list for a given instruemnt run id
"""


from orcabus_api_tools.fastq import get_fastqs_in_libraries_and_instrument_run_id


def handler(event, context):
    """
    Get the fastq objects from the library list for a given instruemnt run id
    :param event:
    :param context:
    :return:
    """

    # Get inputs
    library_id_list = event["libraryIdList"]
    instrument_run_id = event["instrumentRunId"]

    # Get the fastq objects
    fastq_objects = get_fastqs_in_libraries_and_instrument_run_id(library_id_list, instrument_run_id)

    # Return the fastq objects split by library
    return {
        "fastqIdsByLibrary": list(map(
            lambda library_id_iter_: {
                "libraryId": library_id_iter_,
                "fastqIdList": list(map(
                    lambda fastq_object_iter_: fastq_object_iter_["id"],
                    list(filter(
                        lambda fastq_object_iter_: fastq_object_iter_["library"]["libraryId"] == library_id_iter_,
                        fastq_objects
                    ))
                ))
            },
            library_id_list
        ))
    }
