#!/usr/bin/env python3

"""
Add read sets and read counts to fastq objects.
"""

from orcabus_api_tools.fastq import (
    get_fastq, add_read_set,
    add_read_count, detach_read_set
)
from orcabus_api_tools.fastq.models import BoolAllEnum


def handler(event, context):
    """
    Add read sets and read counts to fastq objects.
    :param event:
    :param context:
    :return:
    """

    # Get the input parameters
    fastq_id_list = event['fastqIdList']
    file_names_list = event['fileNamesList']
    demux_data = event['demuxData']

    # Get fastq objects from fastq list
    fastq_objects = list(map(
        lambda fastq_id_iter_: get_fastq(fastq_id_iter_, includeS3Details=BoolAllEnum.true.value),
        fastq_id_list
    ))

    for fastq_object in fastq_objects:
        # Files
        fastq_file_name = next(filter(
            lambda file_name_iter_: file_name_iter_['lane'] == fastq_object['lane'],
            file_names_list
        ))

        # Demux data
        demux_data_object = next(filter(
            lambda demux_data_iter_: demux_data_iter_['lane'] == fastq_object['lane'],
            demux_data
        ))

        if (
            fastq_object['readSet'] is not None
            and fastq_object['readSet'].get('r1', {}).get('s3Uri', None) == fastq_file_name['read1FileUri']
            and fastq_object['readSet'].get('r2', {}).get('s3Uri', None) == fastq_file_name['read2FileUri']
        ):
            # The read set is already attached, skip
            continue

        if fastq_object['readSet'] is not None:
            # Detach the old read set first
            detach_read_set(fastq_object['id'])

        # Add read set
        add_read_set(
            fastq_id=fastq_object['id'],
            read_set={
                "r1": {
                    "s3Uri": fastq_file_name['read1FileUri']
                },
                "r2": {
                    "s3Uri": fastq_file_name['read2FileUri']
                },
                "compressionFormat": (
                    "ORA" if fastq_file_name['read1FileUri'].endswith('.ora') else "GZIP"
                )
            }
        )

        # Add read counts
        add_read_count(
            fastq_id=fastq_object['id'],
            read_count={
                "readCount": demux_data_object['readCount'],
                "baseCountEst": demux_data_object['baseCountEst']
            }
        )
