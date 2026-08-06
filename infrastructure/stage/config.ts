import { StatefulApplicationStackConfig, StatelessApplicationStackConfig } from './interfaces';
import {
  ARCHIVE_BUCKET_NAME,
  AWS_S3_CACHE_BUCKET_NAME,
  AWS_S3_PRIMARY_DATA_PREFIX,
  DATA_MOVER_SFN_ARN,
  EVENT_BUS_NAME,
} from './constants';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

export const getStatefulStackProps = (): StatefulApplicationStackConfig => {
  return {};
};

export const getStatelessStackProps = (stage: StageName): StatelessApplicationStackConfig => {
  return {
    // Stage name
    stageName: stage,

    // Main event bus
    eventBusName: EVENT_BUS_NAME,

    // AWS S3 Bucket Stuff - some lambdas will need read permissions to this bucket
    awsS3CacheBucketName: AWS_S3_CACHE_BUCKET_NAME[stage],
    awsS3PrimaryDataPrefix: AWS_S3_PRIMARY_DATA_PREFIX[stage],

    // Data-mover SFN ARN
    dataMoverSfnArn: DATA_MOVER_SFN_ARN[stage],

    // Archive bucket name
    archiveBucketName: ARCHIVE_BUCKET_NAME[stage],
  };
};
