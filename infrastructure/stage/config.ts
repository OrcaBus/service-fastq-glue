import { StatelessApplicationStackConfig } from './interfaces';
import { AWS_S3_CACHE_BUCKET_NAME, AWS_S3_PRIMARY_DATA_PREFIX, EVENT_BUS_NAME } from './constants';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

export const getStatelessStackProps = (stage: StageName): StatelessApplicationStackConfig => {
  return {
    // Main event bus
    eventBusName: EVENT_BUS_NAME,

    // AWS S3 Bucket Stuff - some lambdas will need read permissions to this bucket
    awsS3CacheBucketName: AWS_S3_CACHE_BUCKET_NAME[stage],
    awsS3PrimaryDataPrefix: AWS_S3_PRIMARY_DATA_PREFIX[stage],
  };
};
