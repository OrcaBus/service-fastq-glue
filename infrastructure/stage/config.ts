import { StageName } from '@orcabus/platform-cdk-constructs/utils';
import { StatelessApplicationStackConfig } from './interfaces';
import {
  AWS_S3_CACHE_BUCKET_NAME,
  AWS_S3_PRIMARY_DATA_PREFIX,
  BSSH_FASTQ_TO_AWS_COPY_STATUS,
  BSSH_FASTQ_TO_AWS_COPY_WORKFLOW_NAME,
  EVENT_BUS_NAME,
  FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE,
  SEQUENCE_RUN_MANAGER_EVENT_SOURCE,
  SEQUENCE_RUN_MANAGER_EVENT_STATUS,
  SEQUENCE_RUN_MANAGER_STATE_CHANGE_EVENT_DETAIL_TYPE,
  STACK_EVENT_SOURCE,
  WORKFLOW_MANAGER_EVENT_SOURCE,
  WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE,
} from './constants';

export const getStatelessStackProps = (stage: StageName): StatelessApplicationStackConfig => {
  return {
    // Main event bus
    eventBusName: EVENT_BUS_NAME,

    // SRM Event Trigger Details
    sequenceRunManagerStateChangeDetailType: SEQUENCE_RUN_MANAGER_STATE_CHANGE_EVENT_DETAIL_TYPE,
    sequenceRunManagerEventSource: SEQUENCE_RUN_MANAGER_EVENT_SOURCE,
    sequenceRunManagerEventStatus: SEQUENCE_RUN_MANAGER_EVENT_STATUS,

    // BSSH Fastq to AWS Copy Trigger Details
    workflowRunStateChangeDetailType: WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE,
    workflowManagerEventSource: WORKFLOW_MANAGER_EVENT_SOURCE,
    bsshFastqToAwsCopyWorkflowName: BSSH_FASTQ_TO_AWS_COPY_WORKFLOW_NAME,
    bsshFastqToAwsCopyWorkflowStatus: BSSH_FASTQ_TO_AWS_COPY_STATUS,

    // Put Event Details
    fastqListRowsAddedDetailType: FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE,
    stackEventSource: STACK_EVENT_SOURCE,

    // AWS S3 Bucket Stuff - some lambdas will need read permissions to this bucket
    awsS3CacheBucketName: AWS_S3_CACHE_BUCKET_NAME[stage],
    awsS3PrimaryDataPrefix: AWS_S3_PRIMARY_DATA_PREFIX[stage],
  };
};
