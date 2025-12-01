import { IBucket } from 'aws-cdk-lib/aws-s3';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';

/** Lambda Interfaces **/
export type LambdaNameList =
  // Fastq set creation
  | 'getLibraryIdListFromSamplesheet'
  | 'getBclconvertDataFromSamplesheet'
  | 'createFastqSetObject'
  // Add readset related
  | 'addReadSetsToFastqObjects'
  | 'getFastqObjects'
  | 'getFileNamesFromFastqListCsv'
  | 'getSampleDemultiplexStats'
  // Extract fingerprint related
  | 'getBamByLibraryId'
  | 'runExtractFingerprint'
  | 'getFastqSetIdByLibrary';

export const lambdaNameList: Array<LambdaNameList> = [
  // Fastq set creation
  'getLibraryIdListFromSamplesheet',
  'getBclconvertDataFromSamplesheet',
  'createFastqSetObject',
  // Add readset related
  'addReadSetsToFastqObjects',
  'getFastqObjects',
  'getFileNamesFromFastqListCsv',
  'getSampleDemultiplexStats',
  // Extract fingerprint related
  'getBamByLibraryId',
  'runExtractFingerprint',
  'getFastqSetIdByLibrary',
];

export interface S3BucketPrefix {
  s3Bucket: IBucket;
  s3Prefix: string;
}

export interface LambdaRequirementProps {
  /* Does the lambda needs read access to the primary data prefix? */
  needsAwsReadAccess?: boolean;

  /* Needs orcabus api tools layer */
  needsOrcabusApiToolsLayer?: boolean;
}

export interface BuildLambdasProps {
  /* Specific env vars */
  s3BucketPrefix: S3BucketPrefix;
}

export interface BuildLambdaProps extends BuildLambdasProps {
  /* Naming formation */
  lambdaName: LambdaNameList;
}

export interface LambdaObject {
  /* Naming formation */
  lambdaName: LambdaNameList;
  /* Lambda function object */
  lambdaFunction: PythonFunction;
}

export type LambdaToRequirementsMapType = { [key in LambdaNameList]: LambdaRequirementProps };

export const lambdaToRequirementsMap: LambdaToRequirementsMapType = {
  // Fastq set creation related
  getLibraryIdListFromSamplesheet: {
    needsOrcabusApiToolsLayer: true,
  },
  getBclconvertDataFromSamplesheet: {
    needsOrcabusApiToolsLayer: true,
  },
  createFastqSetObject: {
    needsOrcabusApiToolsLayer: true,
  },
  // Fastq add readset related
  addReadSetsToFastqObjects: {
    needsOrcabusApiToolsLayer: true,
  },
  getFastqObjects: {
    needsOrcabusApiToolsLayer: true,
  },
  getFileNamesFromFastqListCsv: {
    needsAwsReadAccess: true,
  },
  getSampleDemultiplexStats: {
    needsOrcabusApiToolsLayer: true,
    needsAwsReadAccess: true,
  },
  // Extract fingerprint related
  getBamByLibraryId: {
    needsOrcabusApiToolsLayer: true,
  },
  runExtractFingerprint: {
    needsOrcabusApiToolsLayer: true,
  },
  getFastqSetIdByLibrary: {
    needsOrcabusApiToolsLayer: true,
  },
};
