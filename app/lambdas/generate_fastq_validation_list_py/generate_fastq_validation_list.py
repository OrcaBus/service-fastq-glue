#!/usr/bin/env python3

"""
Generate the fastq validation list.

Given the joined per-library data (fastqIdList + fileNamesList) produced by the
'Get read sets' parallel state, build a flat list of validation objects that the
downstream distributed map iterates over.

Each fastq id is matched to its new file URIs by lane (the same lane-matching
that add_read_sets_to_fastq_objects uses for the actual URI swap).

Only fastq objects that already have a read set attached are included, because
those are the ones we are about to overwrite and therefore want to validate
against the previously recorded read count / raw md5sum. Fastq objects without
an existing read set have nothing to compare against, so they are skipped.

Input event:
{
    "fastqIdList": ["fqr.123", ...],
    "fileNamesList": [
        {"sampleId": "L123", "lane": 1, "read1FileUri": "s3://...R1_001.fastq.ora", "read2FileUri": "s3://...R2_001.fastq.ora"},
        ...
    ]
}

Output:
{
    "validationList": [
        {
            "fastqId": "fqr.123",
            "newRead1FileUri": "s3://...R1_001.fastq.ora",
            "newRead2FileUri": "s3://...R2_001.fastq.ora"  # or null for single-end
        },
        ...
    ]
}
"""

# Standard imports
from typing import List, Optional, Any

# Layer imports
from orcabus_api_tools.fastq import get_fastq
from orcabus_api_tools.fastq.models import Fastq


def flatten(nested: List[Any]) -> List[Any]:
    """
    Defensively flatten one level of nesting.

    The upstream JSONata that builds dataByLibrary can hand us either a flat
    list (e.g. ['fqr.1', 'fqr.2']) or a singly-nested list (e.g. [['fqr.1',
    'fqr.2']]) depending on JSONata sequence semantics. Normalise to a flat list.
    """
    flat: List[Any] = []
    for item in (nested or []):
        if isinstance(item, list):
            flat.extend(item)
        else:
            flat.append(item)
    return flat


def handler(event, context):
    """
    Build the validation list of {fastqId, newRead1FileUri, newRead2FileUri}.
    :param event:
    :param context:
    :return:
    """

    # Get inputs (defensively flatten any JSONata-induced nesting)
    fastq_id_list: List[str] = flatten(event['fastqIdList'])
    file_names_list: List[dict] = flatten(event['fileNamesList'])

    # Fetch fastq objects (we need each fastq's lane and existing read set)
    fastq_objects: List[Fastq] = list(map(
        lambda fastq_id_iter_: get_fastq(fastq_id_iter_, includeS3Details=True),
        fastq_id_list
    ))

    validation_list = []

    for fastq_object in fastq_objects:
        # Only validate fastqs that already have a read set to compare against
        if fastq_object.get('readSet', None) is None:
            continue

        # Match the new file names to this fastq by lane
        fastq_file_name = next(
            filter(
                lambda file_name_iter_: file_name_iter_['lane'] == fastq_object['lane'],
                file_names_list
            ),
            None
        )

        # No new file for this lane - nothing to validate here
        if fastq_file_name is None:
            continue

        new_read_2_file_uri: Optional[str] = fastq_file_name.get('read2FileUri', None)

        validation_list.append({
            "fastqId": fastq_object['id'],
            "newRead1FileUri": fastq_file_name['read1FileUri'],
            "newRead2FileUri": new_read_2_file_uri,
        })

    return {
        "validationList": validation_list
    }
