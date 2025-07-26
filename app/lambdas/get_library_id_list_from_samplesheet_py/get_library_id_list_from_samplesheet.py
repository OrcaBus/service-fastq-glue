#!/usr/bin/env python3

"""
Get samples from the samplesheet

To prevent overloading the step functions, we simply collect all samples from the samplesheet
and return them as a list.

Then in the step function, we can iterate over this list, recollecting the sample, bclconvert data, demux stats
and then creating a fastq set object for each sample.

We get the following as inputs:




"""

# Imports
import typing
import boto3
from pathlib import Path
from urllib.parse import urlparse
from typing import Tuple, Dict, List

# Construct imports
from orcabus_api_tools.sequence import (
    get_libraries_from_instrument_run_id
)

# Type hints
if typing.TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client


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


def handler(event, context) -> Dict[str, List[str]]:
    """
    Given a samplesheet uri and a sample id,
    Download the samplesheet, get the bclconvert data section
    and return only the rows where sample_id is equal to sampleId
    :param event:
    :param context:
    :return:
    """

    # Get the sample id and samplesheet uri from the event
    instrument_run_id = event['instrumentRunId']

    # Get the libraries from the instrument run id via the sequence run manager
    return {
        "libraryIdList": list(sorted(set(get_libraries_from_instrument_run_id(instrument_run_id))))
    }


# if __name__ == "__main__":
#     import json
#     from os import environ
#     environ['AWS_PROFILE'] = 'umccr-production'
#     environ['AWS_REGION'] = 'ap-southeast-2'
#     environ['HOSTNAME_SSM_PARAMETER_NAME'] = '/hosted_zone/umccr/name'
#     environ['ORCABUS_TOKEN_SECRET_ID'] = 'orcabus/token-service-jwt'
#     print(json.dumps(
#         handler(
#             {
#                 "instrumentRunId": "250724_A01052_0269_AHFHWJDSXF"
#             },
#             None
#         ),
#         indent=4
#     ))
#
#     # {
#     #     "libraryIdList": [
#     #         "L2500185",
#     #         "L2500181",
#     #         ...
#     #         "L2500178",
#     #         "L2500179"
#     #     ]
#     # }
