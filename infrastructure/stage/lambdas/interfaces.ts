import { IBucket } from 'aws-cdk-lib/aws-s3';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';

/** Lambda Interfaces **/
export type LambdaNameList =
  | 'addReadSetsToFastqObjects'
  | 'createFastqSetObject'
  | 'getBclconvertDataFromSamplesheet'
  | 'getFastqObjects'
  | 'getFileNamesFromFastqListCsv'
  | 'getLibraryIdListFromSamplesheet'
  | 'getSampleDemultiplexStats'
  // Legacy lambdas (for clag glue)
  | 'getLibraryObjectsFromLibraryIdList'
  | 'getFastqSetIdListForLibraries'
  | 'getFastqListRowsFromFastqSetId'
  | 'getFastqListRowObjectsFromLibraryIdList';

export const lambdaNameList: Array<LambdaNameList> = [
  'addReadSetsToFastqObjects',
  'createFastqSetObject',
  'getBclconvertDataFromSamplesheet',
  'getFastqObjects',
  'getFileNamesFromFastqListCsv',
  'getLibraryIdListFromSamplesheet',
  'getSampleDemultiplexStats',
  // Legacy lambdas (for clag glue)
  'getLibraryObjectsFromLibraryIdList',
  'getFastqSetIdListForLibraries',
  'getFastqListRowObjectsFromLibraryIdList',
  'getFastqListRowsFromFastqSetId',
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
  addReadSetsToFastqObjects: {
    needsOrcabusApiToolsLayer: true,
  },
  createFastqSetObject: {
    needsOrcabusApiToolsLayer: true,
  },
  getBclconvertDataFromSamplesheet: {
    needsOrcabusApiToolsLayer: true,
  },
  getFastqObjects: {
    needsOrcabusApiToolsLayer: true,
  },
  getFileNamesFromFastqListCsv: {
    needsAwsReadAccess: true,
  },
  getLibraryIdListFromSamplesheet: {
    needsOrcabusApiToolsLayer: true,
  },
  getSampleDemultiplexStats: {
    needsAwsReadAccess: true,
  },
  // Legacy lambdas (for clag glue)
  getLibraryObjectsFromLibraryIdList: {
    needsOrcabusApiToolsLayer: true,
  },
  getFastqSetIdListForLibraries: {
    needsOrcabusApiToolsLayer: true,
  },
  getFastqListRowsFromFastqSetId: {
    needsOrcabusApiToolsLayer: true,
  },
  getFastqListRowObjectsFromLibraryIdList: {
    needsOrcabusApiToolsLayer: true,
  },
};
