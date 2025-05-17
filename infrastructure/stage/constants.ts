/* Constants for the stack */

import { StageName } from '@orcabus/platform-cdk-constructs/utils';

import path from 'path';

/* Directory constants */
export const APP_ROOT = path.join(__dirname, '../../app');
export const LAMBDA_DIR = path.join(APP_ROOT, 'lambdas');
export const STEP_FUNCTIONS_DIR = path.join(APP_ROOT, 'step-function-templates');

export const EVENT_BUS_NAME = 'OrcaBusMain';

/* SRM Constants */
export const SEQUENCE_RUN_MANAGER_STATE_CHANGE_EVENT_DETAIL_TYPE = 'SequenceRunStateChange';
export const SEQUENCE_RUN_MANAGER_EVENT_SOURCE = 'orcabus.sequencerunmanager';
export const SEQUENCE_RUN_MANAGER_EVENT_STATUS = 'SUCCEEDED';

/* BSSH Fastq Copy to AWS Constants */
export const WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE = 'WorkflowRunStateChange';
export const WORKFLOW_MANAGER_EVENT_SOURCE = 'orcabus.workflowmanager';
export const BSSH_FASTQ_TO_AWS_COPY_WORKFLOW_NAME = 'bssh-fastq-to-aws-copy';
export const BSSH_FASTQ_TO_AWS_COPY_STATUS = 'SUCCEEDED';

/* Local stack constants */
export const STACK_EVENT_SOURCE = 'orcabus.fastqglue';
export const FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE = 'FastqListRowsAdded';

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
