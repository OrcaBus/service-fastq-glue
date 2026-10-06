#!/usr/bin/env python3

"""
Get samples from the samplesheet

To prevent overloading the step functions, we simply collect all samples from the samplesheet
and return them as a list.

Then in the step function, we can iterate over this list, recollecting the sample, bclconvert data, demux stats
and then creating a fastq set object for each sample.

We get the following as inputs:




"""
import hashlib
# Imports
import typing
import boto3
from pathlib import Path
from urllib.parse import urlparse
from typing import Tuple, Dict, List, Literal, cast

# Construct imports
from orcabus_api_tools.sequence import (
    get_library_id_list_from_instrument_run_id, get_sample_sheet_from_instrument_run_id,
    get_sample_sheet_from_orcabus_id, SampleSheet
)
from orcabus_api_tools.sequence.sequence_helpers import list_sample_sheets_for_instrument_run_id

# Type hints
if typing.TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

# Globals
ValidChecksumType = Literal[
    'md5'
]

VALID_CHECKSUM_TYPE_LIST: List[Literal[ValidChecksumType]] = [
    "md5"
]

# Quick funcs
def get_s3_client() -> 'S3Client':
    return boto3.client('s3')


def get_bucket_key_from_s3_uri(url: str) -> Tuple[str, str]:
    url_obj = urlparse(url)
    return url_obj.netloc, url_obj.path.lstrip("/")


def get_s3_object(bucket: str, key: str, output_path: Path):
    # Make sure parent dir exists
    output_path.parent.mkdir(exist_ok=True, parents=True)

    get_s3_client().download_file(
        Bucket=bucket,
        Key=key,
        Filename=str(output_path)
    )


def get_samplesheet_orcabus_id_from_samplesheet_api_url(
        samplesheet_api_url: str
) -> str:
    """
    Get the samplesheet orcabus id


    """
    return str(
        Path(
            urlparse(samplesheet_api_url).path
        ).name
    )


def get_checksum(
        content: str,
        checksum_type: ValidChecksumType = "md5",
) -> str:
    """
    Get the checksum
    """
    # Check is valid checksum type
    if checksum_type not in VALID_CHECKSUM_TYPE_LIST:
        raise ValueError(f"Checksum type {checksum_type} is not a valid check sum type")

    # Get the checksum type
    if checksum_type == "md5":
        return hashlib.md5(content.encode("utf-8")).hexdigest()



def handler(event, context) -> Dict[str, List[str]]:
    """
    Given a samplesheet uri and a sample id,
    Download the samplesheet, get the bclconvert data section
    and return only the rows where sample_id is equal to sampleId
    :param event:
    :param context:
    :return:
    """

    # Get inputs

    # Get the sample id and samplesheet uri from the event
    instrument_run_id = event['instrumentRunId']

    # Get sequence run id
    sequence_run_id = event.get("sequenceRunId", None)

    # Get API Url
    samplesheet_api_url = event.get('apiUrl', None)

    # Get samplesheet checksum
    samplesheet_checksum = event.get('samplesheetChecksum', None)
    samplesheet_checksum_type = event.get('samplesheetChecksumType', None)

    # Fastq Set Generation will need to go via api url
    # If api url is not None, use the samplesheet endpoint to then get the sequence id used
    # And use that to then get the library id list
    if sequence_run_id is None and samplesheet_api_url is not None:
        # Get samplesheet orcabus id
        samplesheet_orcabus_id = get_samplesheet_orcabus_id_from_samplesheet_api_url(samplesheet_api_url)
        samplesheet = get_sample_sheet_from_orcabus_id(samplesheet_orcabus_id)
        sequence_run_id = samplesheet['sequence']

    # From bssh-to-aws-s3, we have the samplesheet checksum and samplesheet checksum type.
    # Find the samplesheet
    elif sequence_run_id is None and samplesheet_checksum and samplesheet_checksum_type:
        samplesheet_list: List[SampleSheet] = cast(
            List[SampleSheet],
            list_sample_sheets_for_instrument_run_id(
                instrument_run_id=instrument_run_id
            )
        )

        # Get sequence run id by samplesheet
        try:
            samplesheet = next(filter(
                lambda samplesheet_obj_iter_: (
                    get_checksum(
                        samplesheet_obj_iter_['sampleSheetContentOriginal'],
                        samplesheet_checksum_type
                    ) == samplesheet_checksum
                ),
                samplesheet_list
            ))
            sequence_run_id = samplesheet['sequence']

        except StopIteration as e:
            raise ValueError(
                "Could not get samplesheet with matching md5sum"
            ) from e

    return {
        "libraryIdList": list(sorted(list(set(get_library_id_list_from_instrument_run_id(
            instrument_run_id=instrument_run_id,
            sequence_run_id=sequence_run_id
        )))))
    }
