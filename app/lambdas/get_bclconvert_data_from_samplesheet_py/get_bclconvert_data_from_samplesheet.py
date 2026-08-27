#!/usr/bin/env python3

"""
Get the bclconvert data from the samplesheet

Given the inputs

libraryIdList, instrumentRunId and laneList,

1. Pull the sample sheet from the sequence run manager
2. Parse in the samplesheet as a json object
3. Get the bclconvert_data section and filter only the objects where sample_id is equal to sampleId
4. For any bclconvert row that does not specify a lane, expand it over every lane in laneList
   (a sample without a lane is implied to cover every lane on the instrument run)


"""

# Imports
from typing import Dict, List, Optional, Union
from itertools import chain
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


def expand_bclconvert_row_over_lanes(
        bclconvert_row: Dict[str, str],
        lane_list: List[int]
) -> List[Dict[str, str]]:
    """
    Expand a single bclconvert data row over lanes.

    If the row already has a 'lane' attribute, it is returned as-is (single element list).
    Otherwise the sample is assumed to cover every lane on the instrument run, so one copy
    of the row is created per lane in lane_list, with the 'lane' attribute set accordingly.

    :param bclconvert_row: A single row from the bclconvertData section of the samplesheet
    :param lane_list: The list of lanes on the instrument run
    :return: A list of bclconvert data rows, one per lane
    """
    if bclconvert_row.get('lane') is not None:
        return [bclconvert_row]

    return list(map(
        lambda lane_iter_: {
            **bclconvert_row,
            "lane": lane_iter_,
        },
        lane_list
    ))


def get_sample_bclconvert_data_from_v2_samplesheet(
        samplesheet: Dict,
        sample_id: str,
        global_cycle_count: int,
        is_reversed: bool,
        lane_list: List[int]
) -> List[Dict[str, Union[str, int]]]:
    # Get the bclconvert data from the samplesheet
    # Return only the rows of the bclconvert data section where sample_id is equal to sampleId

    # Get the rows for this sample id
    sample_bclconvert_rows = list(filter(
        lambda bclconvert_row_iter_: bclconvert_row_iter_['sampleId'] == sample_id,
        samplesheet['bclconvertData']
    ))

    # Expand any rows that do not have a lane attribute over every lane on the run.
    # A sample without a lane is implied to cover every lane on the instrument run.
    expanded_bclconvert_rows = list(chain.from_iterable(map(
        lambda bclconvert_row_iter_: expand_bclconvert_row_over_lanes(
            bclconvert_row=bclconvert_row_iter_,
            lane_list=lane_list
        ),
        sample_bclconvert_rows
    )))

    return(
        list(map(
            lambda bclconvert_row_iter_: {
                "libraryId": bclconvert_row_iter_['sampleId'],
                "index": (
                        bclconvert_row_iter_['index'] +
                        (
                            "+" + get_index(bclconvert_row_iter_['index2'], is_reversed=is_reversed)
                            if bclconvert_row_iter_.get('index2')
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
            expanded_bclconvert_rows
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

    # Get the list of lanes on the instrument run.
    # Used to expand samples that do not specify a lane (they cover every lane).
    lane_list = event['laneList']

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
                is_reversed=is_reversed,
                lane_list=lane_list
            )
        },
        library_id_list
    ))

    # Return the bclconvert data
    return {
        'bclConvertDataByLibrary': bclconvert_data_by_library
    }
