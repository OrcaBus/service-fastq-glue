/**
 * Interfaces for the application
 *
 * We define all lambdas, step functions, event rules and event targets here
 * Along with their requirements.
 *
 * This makes the actual generation of the objects much easier to read and understand.
 */

import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

/** Application Interfaces **/
export interface StatelessApplicationStackConfig {
  /* Stage name */
  stageName: StageName;

  /* Event stuff */
  eventBusName: string;

  /*
    S3 Stuff - some lambdas will need permissions to read from the bucket
  */
  awsS3CacheBucketName: string;
  awsS3PrimaryDataPrefix: string;
}

export type StatefulApplicationStackConfig = object;
