#!/usr/bin/env python3

"""
Get the bclconvert data from the samplesheet

Given the inputs

sampleId and sampleSheetUri,

1. Pull the sample sheet from S3
2. Parse in the samplesheet as a json object
3. Get the bclconvert_data section and filter only the objects where sample_id is equal to sampleId


"""

# Imports
from typing import Dict, List, Optional, Union
import re


# Orcabus API tool imports
from orcabus_api_tools.sequence import (
    get_sample_sheet_from_instrument_run_id
)


def get_cycle_count_from_bclconvert_data_row(bclconvert_data_row: Dict[str, str]) -> Optional[int]:
    """
    Get the cycle count from the bclconvert data row if overrideCycles is present
    :param bclconvert_data_row:
    :return:
    """
    if "overrideCycles" in bclconvert_data_row:
        override_cycles = bclconvert_data_row['overrideCycles']
        return get_cycle_count_from_override_cycles(override_cycles)
    return None


def get_index(
        index_str: str,
        is_reversed: bool
) -> str:
    """
    Make the index reverse complemented if is_reversed is True
    Otherwise return the index as is
    (Didn't realise maketrans / translate could be used this way until now, thank you copilot.)

    :param index_str: A string containing ACGTN characters
    :param is_reversed: Boolean indicating if the index should be reverse complemented
    :return: The (possibly reverse complemented) index string
    """
    if not is_reversed:
        return index_str
    # Reverse complement the index
    complement = str.maketrans("ACGTN", "TGCAN")
    return index_str.translate(complement)[::-1]


def get_sample_bclconvert_data_from_v2_samplesheet(
        samplesheet: Dict,
        sample_id: str,
        global_cycle_count: int,
        is_reversed: bool
) -> List[Dict[str, Union[str, int]]]:
    # Get the bclconvert data from the samplesheet
    # Return only the rows of the bclconvert data section where sample_id is equal to sampleId
    return(
        list(map(
            lambda bclconvert_row_iter_: {
                "libraryId": bclconvert_row_iter_['sampleId'],
                "index": (
                        bclconvert_row_iter_['index'] +
                        (
                            "+" + get_index(bclconvert_row_iter_['index2'], is_reversed=is_reversed)
                            if bclconvert_row_iter_['index2']
                            else ""
                        )
                ),
                "lane": int(bclconvert_row_iter_['lane']),
                "cycleCount": (
                    get_cycle_count_from_bclconvert_data_row(bclconvert_row_iter_)
                    if get_cycle_count_from_bclconvert_data_row(bclconvert_row_iter_) is not None
                    else global_cycle_count
                )
            },
            list(filter(
                lambda bclconvert_row_iter_: bclconvert_row_iter_['sampleId'] == sample_id,
                samplesheet['bclconvertData']
            ))
        ))
    )


def get_cycle_count_from_override_cycles(override_cycles: str) -> int:
    read_cycle_regex_match = re.findall("[yY]([0-9]+)", override_cycles)
    if read_cycle_regex_match is None or len(read_cycle_regex_match) == 0:
        raise ValueError("Invalid override_cycles format")
    if len(read_cycle_regex_match) == 1:
        return int(read_cycle_regex_match[0])
    return int(read_cycle_regex_match[0]) + int(read_cycle_regex_match[1])


def get_global_cycle_count(samplesheet: Dict) -> int:
    if samplesheet['bclconvertSettings'].get("overrideCycles") is not None:
        override_cycles = samplesheet['bclconvertSettings']['overrideCycles']
        return get_cycle_count_from_override_cycles(override_cycles)
    return samplesheet['reads']['read1Cycles'] + samplesheet['reads'].get('read2Cycles', 0)


def handler(event, context) -> Dict[str, List[Dict[str, str]]]:
    """
    Given a samplesheet uri and a list of library ids,
    Download the samplesheet, get the bclconvert data section
    and return only the rows where sample_id is equal to libraryId
    :param event:
    :param context:
    :return:
    """

    # Get the sample id and samplesheet uri from the event
    library_id_list = event['libraryIdList']
    instrument_run_id = event['instrumentRunId']

    # Get the sequence orcabus id

    # Read the samplesheet
    samplesheet: Dict = get_sample_sheet_from_instrument_run_id(instrument_run_id)['sampleSheetContent']

    # Check the header InstrumentPlatform / Instrument Type
    is_reversed = False
    if (
            samplesheet['header'].get("instrumentPlatform", "").lower() == "novaseqxseries" or
            samplesheet['header'].get("instrumentType", "").lower() == "novaseq x"
    ):
        # i5 Index is flipped, so we need to set the reverse complement flag
        is_reversed = True

    # Get override cycles from the samplesheet settings section
    global_cycle_count = get_global_cycle_count(samplesheet)

    # Get the bclconvert data from the samplesheet
    bclconvert_data_by_library = list(map(
        lambda library_id_iter_: {
            "libraryId": library_id_iter_,
            "bclConvertData": get_sample_bclconvert_data_from_v2_samplesheet(
                samplesheet=samplesheet,
                sample_id=library_id_iter_,
                global_cycle_count=global_cycle_count,
                is_reversed=is_reversed
            )
        },
        library_id_list
    ))

    # Return the bclconvert data
    return {
        'bclConvertDataByLibrary': bclconvert_data_by_library
    }
