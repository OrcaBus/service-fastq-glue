/* Constants for the stack */

import path from 'path';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';
import { EVENT_SCHEMA_REGISTRY_NAME } from '@orcabus/platform-cdk-constructs/shared-config/event-bridge';

/* Directory constants */
export const APP_ROOT = path.join(__dirname, '../../app');
export const LAMBDA_DIR = path.join(APP_ROOT, 'lambdas');
export const STEP_FUNCTIONS_DIR = path.join(APP_ROOT, 'step-function-templates');
export const EVENT_SCHEMAS_DIR = path.join(APP_ROOT, 'event-schemas');
export const EVENT_BUS_NAME = 'OrcaBusMain';

/* SRM Constants */
export const SEQUENCE_RUN_MANAGER_EVENT_SOURCE = 'orcabus.sequencerunmanager';

export const SEQUENCE_RUN_MANAGER_SAMPLESHEET_CHANGE_DETAIL_TYPE = 'SequenceRunSampleSheetChange';
export const SEQUENCE_RUN_MANAGER_STATE_CHANGE_DETAIL_TYPE = 'SequenceRunStateChange';
export const SEQUENCE_RUN_MANAGER_FAILURE_STATUS = 'FAILED';

/* BSSH Fastq Copy to AWS Constants */
export const WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE = 'WorkflowRunStateChange';
export const WORKFLOW_MANAGER_EVENT_SOURCE = 'orcabus.workflowmanager';
export const BSSH_TO_AWS_S3_COPY_WORKFLOW_NAME = 'bssh-to-aws-s3';
export const BSSH_TO_AWS_S3_COPY_STATUS = 'SUCCEEDED';

/* Dragen Workflows (with bams) */
export const DRAGEN_WGTS_DNA_WORKFLOW_NAME = 'dragen-wgts-dna';
export const DRAGEN_WGTS_RNA_WORKFLOW_NAME = 'dragen-wgts-rna';
export const DRAGEN_TSO500_CTDNA_WORKFLOW_NAME = 'dragen-tso500-ctdna';

/* Local stack constants */
export const STACK_SOURCE = 'orcabus.fastqglue';
export const STACK_PREFIX = 'fastq-glue';

/* SSM Constants */
export const SSM_PARAMETER_PATH_PREFIX = path.join(`/orcabus/fastq-glue/`);

/* Event Details */
export const FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE = 'FastqListRowsAdded';
export const READ_SETS_ADDED_EVENT_DETAIL_TYPE = 'ReadSetsAdded';
export const SRM_CLEANUP_EVENT_DETAIL_TYPE = 'SrmFailureCleanupFastqCompleted';
export const BCL_DELETION_REQUEST_EVENT_DETAIL_TYPE = 'SequencingRunBclDeletionRequest';
export const BCL_DELETION_COMPLETED_EVENT_DETAIL_TYPE = 'SequencingRunBclDeletionCompleted';
export const FASTQ_ARCHIVING_REQUEST_EVENT_DETAIL_TYPE = 'SequencingRunFastqArchivingRequest';
export const FASTQ_ARCHIVING_COMPLETED_EVENT_DETAIL_TYPE = 'SequencingRunFastqArchivingCompleted';

/* Somalier constants */
export const DEFAULT_REFERENCE_NAME = 'hg38';

/*
AWS S3 Resources differ between environments
*/
export const AWS_S3_CACHE_BUCKET_NAME: Record<StageName, string> = {
  ['BETA']: 'pipeline-dev-cache-503977275616-ap-southeast-2',
  ['GAMMA']: 'pipeline-stg-cache-503977275616-ap-southeast-2',
  ['PROD']: 'pipeline-prod-cache-503977275616-ap-southeast-2',
};

export const AWS_S3_PRIMARY_DATA_PREFIX: Record<StageName, string> = {
  ['BETA']: 'byob-icav2/development/primary/',
  ['GAMMA']: 'byob-icav2/staging/primary/',
  ['PROD']: 'byob-icav2/production/primary/',
};

/* Data-mover SFN ARN per environment */
export const DATA_MOVER_SFN_ARN: Record<StageName, string> = {
  ['BETA']: 'arn:aws:states:ap-southeast-2:503977275616:stateMachine:orcabus-data-migrate-mover',
  ['GAMMA']: 'arn:aws:states:ap-southeast-2:503977275616:stateMachine:orcabus-data-migrate-mover',
  ['PROD']: 'arn:aws:states:ap-southeast-2:503977275616:stateMachine:orcabus-data-migrate-mover',
};

/* Archive bucket per environment */
export const ARCHIVE_BUCKET_NAME: Record<StageName, string> = {
  ['BETA']: '',
  ['GAMMA']: '',
  ['PROD']: 'archive-prod-fastq-503977275616-ap-southeast-2',
};

/* BaseSpace SSM/Secrets paths */
export const BASESPACE_API_SERVER_SSM_PARAMETER_PATH = '/orcabus/fastq-glue/basespace/api-server';
export const BASESPACE_ACCESS_TOKEN_SECRET_PATH = '/orcabus/fastq-glue/basespace/access-token';

/* Schema constants */
export const SCHEMA_REGISTRY_NAME = EVENT_SCHEMA_REGISTRY_NAME;
export const SSM_SCHEMA_ROOT = path.join(SSM_PARAMETER_PATH_PREFIX, 'schemas');

/*
Lab Metadata constants
*/
// Internal constants required for the stack
export const METADATA_TRACKING_SHEET_ID_SSM_PARAMETER_PATH =
  '/umccr/google/drive/tracking_sheet_id';
export const GDRIVE_AUTH_JSON_SSM_PARAMETER_PATH = '/umccr/google/drive/lims_service_account_json';
