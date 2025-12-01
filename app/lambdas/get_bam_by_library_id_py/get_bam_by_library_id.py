#!/usr/bin/env python3

"""
Given a workflow run object, retrieve a bam file for each library in the workflow run object.

For dragen-tso500-ctdna workflows, the bam file can be found under Logs_Intermediates/DragenCaller/<libraryId>/<libraryId>_tumor.bam

For dragen-wgts-dna workflows, the tumor bam file can be found under *dragen_wgts_dna_somatic_variant_calling/<TLIBID>_tumor.bam
While the complement normal bam file can be found under *dragen_wgts_dna_somatic_variant_calling/<NLIBID>_normal.bam

For dragen-wgts-rna workflows, the bam file can be found under *dragen_wgts_rna_variant_calling/<LIBID>.bam

"""
from urllib.parse import urlunparse

# Layer imports
from orcabus_api_tools.workflow import get_latest_payload_from_workflow_run
from orcabus_api_tools.workflow.models import WorkflowRun
from orcabus_api_tools.filemanager import list_files_from_portal_run_id

# Globals
DRAGEN_TSO500_CTDNA_WORKFLOW_NAME = "dragen-tso500-ctdna"
DRAGEN_WGTS_DNA_WORKFLOW_NAME = "dragen-wgts-dna"
DRAGEN_WGTS_RNA_WORKFLOW_NAME = "dragen-wgts-rna"


def get_file_uri_from_portal_run_id_and_suffix(
        portal_run_id: str,
        suffix: str
) -> str:
    """
    Given a portal run id and a suffix, return the file uri.
    :param portal_run_id:
    :param suffix:
    :return:
    """
    return next(map(
        lambda file_iter_: str(urlunparse((
            "s3", file_iter_['bucket'], file_iter_['key'],
            None, None, None
        ))),
        filter(
            lambda file_iter_: file_iter_['key'].endswith(suffix),
            list_files_from_portal_run_id(portal_run_id=portal_run_id)
        ))
    )


def handler(event, context):
    """
    Take workflowRunObj and return a mapping of one library id and one bam file path.
    :param event:
    :param context:
    :return:
    """

    # Get inputs
    workflow_run_obj: WorkflowRun = event['workflowRunObj']

    # Initialise outputs
    bams_by_library_id_list = []

    # Get workflow name
    workflow_name = workflow_run_obj['workflow']['name']

    # Workflow payload
    latest_payload = get_latest_payload_from_workflow_run(
        workflow_run_orcabus_id=workflow_run_obj['orcabusId']
    )

    # Get portal run id
    portal_run_id = workflow_run_obj['portalRunId']

    if workflow_name == DRAGEN_TSO500_CTDNA_WORKFLOW_NAME:
        library_id = latest_payload['data']['tags']['libraryId']

        bams_by_library_id_list.append(
            {
                "libraryId": workflow_run_obj['libraries'][0]['libraryId'],
                "bamUri": get_file_uri_from_portal_run_id_and_suffix(
                    portal_run_id=portal_run_id,
                    suffix=f"Logs_Intermediates/DragenCaller/{library_id}/{library_id}_tumor.bam"
                )
            }
        )

    elif workflow_name == DRAGEN_WGTS_DNA_WORKFLOW_NAME:
        library_id = latest_payload['data']['tags']['libraryId']
        tumor_library_id = latest_payload['data']['tags'].get('tumorLibraryId', None)

        # Get the normal library from the somatic calling step if tumor library id is present
        if tumor_library_id is not None:
            bams_by_library_id_list.extend([
                {
                    "libraryId": tumor_library_id,
                    "bamUri": get_file_uri_from_portal_run_id_and_suffix(
                        portal_run_id=portal_run_id,
                        suffix=f"dragen_wgts_dna_somatic_variant_calling/{tumor_library_id}_tumor.bam"
                    )
                },
                {
                    "libraryId": library_id,
                    "bamUri": get_file_uri_from_portal_run_id_and_suffix(
                        portal_run_id=portal_run_id,
                        suffix=f"dragen_wgts_dna_somatic_variant_calling/{library_id}_normal.bam"
                    )
                }
            ])
        else:
            bams_by_library_id_list.append(
                {
                    "libraryId": library_id,
                    "bamUri": get_file_uri_from_portal_run_id_and_suffix(
                        portal_run_id=portal_run_id,
                        suffix=f"dragen_wgts_dna_germline_variant_calling/{library_id}_normal.bam"
                    )
                }
            )

    elif workflow_name == DRAGEN_WGTS_RNA_WORKFLOW_NAME:
        library_id = latest_payload['data']['tags']['libraryId']

        bams_by_library_id_list.append(
            {
                "libraryId": workflow_run_obj['libraries'][0]['libraryId'],
                "bamUri": get_file_uri_from_portal_run_id_and_suffix(
                    portal_run_id=portal_run_id,
                    suffix=f"dragen_wgts_rna_variant_calling/{library_id}.bam"
                )
            }
        )

    else:
        raise ValueError(f"Unsupported workflow name: {workflow_name}")

    return {
        "bamsByLibraryId": bams_by_library_id_list
    }
