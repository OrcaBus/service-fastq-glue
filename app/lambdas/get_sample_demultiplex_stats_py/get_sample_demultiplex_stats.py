#!/usr/bin/env python3

"""
Get samplesheet demux stats

Import the demux stats file, query for the library of interest and return stats in the following format:

{
    "index": "AAAA+GGGG",
    "lane": 1,
    "library": "sample_name",
    "readCount": 111111
}

Demux stats file has the following columns:
Lane,SampleID,Index,# Reads,# Perfect Index Reads,# One Mismatch Index Reads,# Two Mismatch Index Reads,% Reads,% Perfect Index Reads,% One Mismatch Index Reads,% Two Mismatch Index Reads

"""

# Imports
import re
import pandas as pd
from tempfile import NamedTemporaryFile
import typing
import boto3
from pathlib import Path
from urllib.parse import urlparse
from typing import Tuple, Dict, List, Any, Optional
import logging

# Construct imports
from orcabus_api_tools.sequence import (
    get_sample_sheet_from_instrument_run_id
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


def read_demux_stats_csv(demux_stats_uri: str) -> pd.DataFrame:
    """
    Pandas Dataframe returned has the following columns:
    Lane,SampleID,Index,# Reads,# Perfect Index Reads,# One Mismatch Index Reads,# Two Mismatch Index Reads,% Reads,% Perfect Index Reads,% One Mismatch Index Reads,% Two Mismatch Index Reads
    :param demux_stats_uri:
    :return:
    """
    bucket, key = get_bucket_key_from_s3_uri(demux_stats_uri)

    # Create a temporary file to store the samplesheet
    temp_file = Path(NamedTemporaryFile(delete=False, suffix=".csv").name)

    # Download the samplesheet from S3
    get_s3_object(bucket, key, temp_file)

    # Read the samplesheet
    return pd.read_csv(
        temp_file,
        # Will always have a header
        header=0
    )


def get_cycle_count_from_override_cycles(override_cycles: str) -> int:
    read_cycle_regex_match = re.findall("(?:[yY])([0-9]+)", override_cycles)
    if read_cycle_regex_match is None or len(read_cycle_regex_match) == 0:
        raise ValueError("Invalid override_cycles format")
    if len(read_cycle_regex_match) == 1:
        return int(read_cycle_regex_match[0])
    return int(read_cycle_regex_match[0]) + int(read_cycle_regex_match[1])


def get_global_cycle_count(samplesheet: Dict) -> int:
    if samplesheet['bclconvertSettings'].get("overrideCycles") is not None:
        override_cycles = samplesheet['bclconvertSettings']['overrideCycles']
        return get_cycle_count_from_override_cycles(override_cycles)
    return samplesheet['reads']['read1Cycles'] + samplesheet['reads'].get('read2Cycles', None)


def get_cycle_count_from_bclconvert_data_row(bclconvert_data_row: Dict[str, str]) -> Optional[int]:
    if "overrideCycles" in bclconvert_data_row:
        override_cycles = bclconvert_data_row['overrideCycles']
        return get_cycle_count_from_override_cycles(override_cycles)
    return None


def get_est_count_from_samplesheet(
        series_iter_,
        samplesheet_dict: Dict[str, Dict[str, Any]],
        global_cycle_count: int
):
    """
    Get the estimated count from the samplesheet
    :param series_iter_:
    :param samplesheet_dict:
    :param global_cycle_count:
    :return:
    """
    return list(map(
        lambda series_iter_map_: (
                (
                    get_cycle_count_from_bclconvert_data_row(next(filter(
                        lambda bclconvert_data_iter_: bclconvert_data_iter_['sampleId'] == series_iter_map_[1][
                            'SampleID'],
                        samplesheet_dict['bclconvertData']
                    )))
                    if get_cycle_count_from_bclconvert_data_row(samplesheet_dict['bclconvertData']) is not None
                    else global_cycle_count
                ) * series_iter_map_[1]['# Reads']
        ),
        series_iter_.iterrows()
    ))


def get_rows_demux_stats_df(
        sample_id_list: List[str],
        demux_stats_df: pd.DataFrame,
        samplesheet_dict: Dict[str, Dict[str, Any]]
) -> pd.DataFrame:
    """
    Get the file names from the demultiplex dataframe
    :param sample_id_list:
    :param demux_stats_df:
    :param samplesheet_dict:
    :return:
    """
    return (
        demux_stats_df.copy().query(
            "SampleID in @sample_id_list",
        ).assign(
            sampleId=lambda row_iter_: row_iter_["SampleID"],
            lane=lambda row_iter_: pd.to_numeric(row_iter_["Lane"]),
            readCount=lambda row_iter_: row_iter_["# Reads"],
            baseCountEst=lambda row_iter_: get_est_count_from_samplesheet(
                row_iter_,
                samplesheet_dict,
                get_global_cycle_count(samplesheet_dict)
            )
        )[[
            "sampleId", "lane", "readCount", "baseCountEst"
        ]]
    )


def handler(event, context) -> Dict[str, List[Dict[str, str]]]:
    """
    Get the read counts from the demux stats file
    :param event:
    :param context:
    :return:
    """

    # Get the sample id and samplesheet uri from the event
    sample_id_list = event['sampleIdList']
    demux_stats_uri = event['demuxStatsUri']
    instrumentRunId = event['instrumentRunId']

    # Get the demux stats uris
    demux_stats_df = read_demux_stats_csv(demux_stats_uri)

    # Get the sequence id from the instrument run id
    samplesheet_dict = get_sample_sheet_from_instrument_run_id(instrumentRunId).get('sampleSheetContent', {})

    if not samplesheet_dict:
        logging.warning("Samplesheet dict is empty, cannot process demux stats.")

    demux_stats_df = get_rows_demux_stats_df(
        sample_id_list,
        demux_stats_df,
        samplesheet_dict
    )

    # Return fastq list rows for this sample
    return {
        'demuxDataBySample': list(map(
            lambda sample_id_iter_: (
                {
                    "sampleId": sample_id_iter_,
                    "demuxData": (
                        demux_stats_df.query('sampleId == @sample_id_iter_').
                        to_dict(orient='records')
                    )
                }
            ),
            sample_id_list
        ))
    }


# if __name__ == "__main__":
#     import json
#     from os import environ
#
#     environ['AWS_PROFILE'] = 'umccr-production'
#     environ['AWS_REGION'] = 'ap-southeast-2'
#     environ['HOSTNAME_SSM_PARAMETER_NAME'] = '/hosted_zone/umccr/name'
#     environ['ORCABUS_TOKEN_SECRET_ID'] = 'orcabus/token-service-jwt'
#     print(json.dumps(
#         handler(
#             {
#                 "sampleIdList": [
#                     "LPRJ241540",
#                     "LPRJ241542",
#                     "LPRJ251219",
#                     "LPRJ251220"
#                 ],
#                 "demuxStatsUri": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/primary/250724_A01052_0269_AHFHWJDSXF/2025072611867654/Reports/Demultiplex_Stats.csv",
#                 "instrumentRunId": "250724_A01052_0269_AHFHWJDSXF"
#             },
#                 None
#         ),
#         indent=4
#     ))
#
#     # {
#     #     "demuxDataBySample": [
#     #         {
#     #             "sampleId": "LPRJ241540",
#     #             "demuxData": [
#     #                 {
#     #                     "sampleId": "LPRJ241540",
#     #                     "lane": 2,
#     #                     "readCount": 104302869,
#     #                     "baseCountEst": 31499466438
#     #                 }
#     #             ]
#     #         },
#     #         {
#     #             "sampleId": "LPRJ241542",
#     #             "demuxData": [
#     #                 {
#     #                     "sampleId": "LPRJ241542",
#     #                     "lane": 2,
#     #                     "readCount": 131864398,
#     #                     "baseCountEst": 39823048196
#     #                 }
#     #             ]
#     #         },
#     #         {
#     #             "sampleId": "LPRJ251219",
#     #             "demuxData": [
#     #                 {
#     #                     "sampleId": "LPRJ251219",
#     #                     "lane": 4,
#     #                     "readCount": 532167142,
#     #                     "baseCountEst": 160714476884
#     #                 }
#     #             ]
#     #         },
#     #         {
#     #             "sampleId": "LPRJ251220",
#     #             "demuxData": [
#     #                 {
#     #                     "sampleId": "LPRJ251220",
#     #                     "lane": 4,
#     #                     "readCount": 627957040,
#     #                     "baseCountEst": 189643026080
#     #                 }
#     #             ]
#     #         }
#     #     ]
#     # }
