/* Constants for the stack */

import path from 'path';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

/* Directory constants */
export const APP_ROOT = path.join(__dirname, '../../app');
export const LAMBDA_DIR = path.join(APP_ROOT, 'lambdas');
export const STEP_FUNCTIONS_DIR = path.join(APP_ROOT, 'step-function-templates');

export const EVENT_BUS_NAME = 'OrcaBusMain';

/* SRM Constants */
export const SEQUENCE_RUN_MANAGER_SAMPLESHEET_CHANGE_DETAIL_TYPE = 'SequenceRunSampleSheetChange';
export const SEQUENCE_RUN_MANAGER_EVENT_SOURCE = 'orcabus.sequencerunmanager';

/* BSSH Fastq Copy to AWS Constants */
export const WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE = 'WorkflowRunStateChange';
export const WORKFLOW_MANAGER_EVENT_SOURCE = 'orcabus.workflowmanager';
export const BSSH_TO_AWS_S3_COPY_WORKFLOW_NAME = 'bssh-to-aws-s3';
export const BSSH_TO_AWS_S3_COPY_STATUS = 'SUCCEEDED';

/* Local stack constants */
export const STACK_SOURCE = 'orcabus.fastqglue';
export const STACK_PREFIX = 'fastq-glue';

/* Event Details */
export const FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE = 'FastqListRowsAdded';
export const READ_SETS_ADDED_EVENT_DETAIL_TYPE = 'ReadSetsAdded';

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

/*
Lab Metadata constants
*/
// Internal constants required for the stack
export const METADATA_TRACKING_SHEET_ID_SSM_PARAMETER_PATH =
  '/umccr/google/drive/tracking_sheet_id';
export const GDRIVE_AUTH_JSON_SSM_PARAMETER_PATH = '/umccr/google/drive/lims_service_account_json';

/* Stacky Constants */

export const SAMPLESHEET_SHOWER_STATE_CHANGE_DETAIL_TYPE = 'SamplesheetShowerStateChange';
export const SAMPLESHEET_SHOWER_STARTING_STATUS = 'SamplesheetRegisteredEventShowerStarting';
export const SAMPLESHEET_SHOWER_COMPLETE_STATUS = 'SamplesheetRegisteredEventShowerComplete';
export const START_SAMPLESHEET_SHOWER_PAYLOAD_VERSION = '0.1.0';
export const END_SAMPLESHEET_SHOWER_PAYLOAD_VERSION = '0.1.0';
export const LIBRARY_IN_SAMPLESHEET_STATUS = 'LibraryInSamplesheet';
export const SAMPLESHEET_METADATA_UNION_PAYLOAD_VERSION = '0.1.0';
export const SAMPLESHEET_METADATA_UNION_DETAIL_TYPE = 'SamplesheetMetadataUnion';

export const FASTQ_LIST_ROW_SHOWER_START_STATUS = 'FastqListRowEventShowerStarting';
export const FASTQ_LIST_ROW_SHOWER_START_PAYLOAD_VERSION = '0.1.0';
export const STACKY_FASTQ_LIST_ROW_SHOWER_STATE_CHANGE = 'FastqListRowShowerStateChange';
export const STACKY_FASTQ_LIST_ROW_STATE_CHANGE = 'StackyFastqListRowStateChange';
export const FASTQ_SYNC_DETAIL_TYPE = 'fastqSync';
export const NEW_FASTQ_LIST_ROW_STATUS = 'newFastqListRow';
export const NEW_FASTQ_LIST_ROW_PAYLOAD_VERSION = '0.1.0';
export const FASTQ_LIST_ROW_EVENT_SHOWER_COMPLETE_STATUS = 'FastqListRowEventShowerComplete';
export const FASTQ_LIST_ROW_SHOWER_COMPLETE_PAYLOAD_VERSION = '0.1.0';
