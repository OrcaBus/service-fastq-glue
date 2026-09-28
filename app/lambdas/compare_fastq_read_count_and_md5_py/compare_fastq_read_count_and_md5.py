#!/usr/bin/env python3

"""
Compare the read count and raw md5sum of the newly copied files against the
values already recorded on the fastq object by the fastq manager.

This lambda never raises on a data mismatch - mismatches are returned as data so
that the calling step function can complete the validation for every fastq in
the run and report all discrepancies together, rather than failing on the first
one.

The read count and raw md5sum of the new files are calculated by the
fastq-decompression manager (pointed at the new file URIs via
fileUriByFastqIdMap). The recorded values come from the fastq object:
  - readCount            -> fastq_object['readCount']
  - raw md5sum (r1 / r2) -> fastq_object['readSet']['r1' | 'r2']['rawMd5sum']

The decompression raw md5sum output is keyed by the fastq object's existing
read set ingest ids, so we map each returned md5sum back to r1 / r2 by matching
the ingest id against the read set's s3IngestId.

Input event:
{
    "fastqId": "fqr.123",
    # Output of the ReadCountCalculationRequestSync decompression job
    "readCountResult": {
        "readCountList": [
            {"fastqId": "fqr.123", "readCount": 123456}
        ]
    },
    # Output of the OraToRawMd5sumCalculationRequestSync decompression job
    "rawMd5sumResult": {
        "rawMd5sumList": [
            {
                "fastqId": "fqr.123",
                "rawMd5sumByOraFileIngestIdList": [
                    {"ingestId": "019387bd-...", "rawMd5sum": "0123...def"}
                ]
            }
        ]
    }
}

Output:
{
    "fastqId": "fqr.123",
    "matches": true,
    "discrepancies": [
        # zero or more of:
        # {"fastqId": "...", "type": "READ_COUNT", "expected": 1, "actual": 2}
        # {"fastqId": "...", "type": "RAW_MD5SUM", "read": "r1", "expected": "a", "actual": "b"}
    ]
}
"""

# Standard imports
from typing import List, Optional, Dict, Any

# Layer imports
from orcabus_api_tools.fastq import get_fastq
from orcabus_api_tools.fastq.models import Fastq


def get_read_count_for_fastq(read_count_result: Dict[str, Any], fastq_id: str) -> Optional[int]:
    """
    Pull the read count for this fastq id out of the decompression read count output.
    """
    read_count_list = (read_count_result or {}).get('readCountList', [])
    match = next(
        filter(lambda iter_: iter_.get('fastqId') == fastq_id, read_count_list),
        None
    )
    if match is None:
        return None
    return match.get('readCount', None)


def get_md5sum_by_ingest_id_for_fastq(
        raw_md5sum_result: Dict[str, Any],
        fastq_id: str
) -> Dict[str, str]:
    """
    Build a { ingestId: rawMd5sum } lookup for this fastq id out of the
    decompression raw md5sum output.
    """
    raw_md5sum_list = (raw_md5sum_result or {}).get('rawMd5sumList', [])
    match = next(
        filter(lambda iter_: iter_.get('fastqId') == fastq_id, raw_md5sum_list),
        None
    )
    if match is None:
        return {}
    return dict(map(
        lambda iter_: (iter_['ingestId'], iter_['rawMd5sum']),
        match.get('rawMd5sumByOraFileIngestIdList', [])
    ))


def compare_read_count(
        fastq_id: str,
        fastq_object: Fastq,
        read_count_result: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Compare the recorded read count against the newly calculated read count.
    """
    expected = fastq_object.get('readCount', None)
    actual = get_read_count_for_fastq(read_count_result, fastq_id)

    if expected is None or actual is None:
        # We can't compare if either side is missing - treat as a discrepancy so
        # it is surfaced rather than silently passing.
        return [{
            "fastqId": fastq_id,
            "type": "READ_COUNT",
            "expected": expected,
            "actual": actual,
        }]

    if int(expected) != int(actual):
        return [{
            "fastqId": fastq_id,
            "type": "READ_COUNT",
            "expected": expected,
            "actual": actual,
        }]

    return []


def compare_raw_md5sums(
        fastq_id: str,
        fastq_object: Fastq,
        raw_md5sum_result: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Compare the recorded raw md5sum(s) against the newly calculated md5sum(s),
    mapping the decompression output back to r1 / r2 by ingest id.
    """
    discrepancies: List[Dict[str, Any]] = []

    read_set = fastq_object.get('readSet', None)
    if read_set is None:
        return discrepancies

    md5sum_by_ingest_id = get_md5sum_by_ingest_id_for_fastq(raw_md5sum_result, fastq_id)

    for read_key in ['r1', 'r2']:
        read_object = read_set.get(read_key, None)
        if read_object is None:
            continue

        ingest_id = read_object.get('s3IngestId', None)
        expected = read_object.get('rawMd5sum', None)
        actual = md5sum_by_ingest_id.get(ingest_id, None)

        # No recorded md5 for this read - nothing to compare against
        if expected is None:
            continue

        if actual is None or actual != expected:
            discrepancies.append({
                "fastqId": fastq_id,
                "type": "RAW_MD5SUM",
                "read": read_key,
                "expected": expected,
                "actual": actual,
            })

    return discrepancies


def handler(event, context):
    """
    Compare read count and raw md5sum for a single fastq id.
    :param event:
    :param context:
    :return:
    """

    # Get inputs
    fastq_id: str = event['fastqId']
    read_count_result: Dict[str, Any] = event.get('readCountResult', {})
    raw_md5sum_result: Dict[str, Any] = event.get('rawMd5sumResult', {})

    # Fetch the current fastq object (recorded read count + md5sums)
    fastq_object: Fastq = get_fastq(fastq_id, includeS3Details=True)

    # Collect discrepancies (never raise - the caller aggregates and decides)
    discrepancies: List[Dict[str, Any]] = []
    discrepancies.extend(compare_read_count(fastq_id, fastq_object, read_count_result))
    discrepancies.extend(compare_raw_md5sums(fastq_id, fastq_object, raw_md5sum_result))

    return {
        "fastqId": fastq_id,
        "matches": len(discrepancies) == 0,
        "discrepancies": discrepancies,
    }
