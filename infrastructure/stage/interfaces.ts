/**
 * Interfaces for the application
 *
 * We define all lambdas, step functions, event rules and event targets here
 * Along with their requirements.
 *
 * This makes the actual generation of the objects much easier to read and understand.
 */

import * as cdk from 'aws-cdk-lib';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { IEventBus, Rule } from 'aws-cdk-lib/aws-events';
import { IBucket } from 'aws-cdk-lib/aws-s3';

/** Application Interfaces **/

export interface StatelessApplicationStackConfig extends cdk.StackProps {
  /* Event stuff */
  eventBusName: string;

  /* Triggers */

  /* SRM Events */
  sequenceRunManagerStateChangeDetailType: string;
  sequenceRunManagerEventSource: string;
  sequenceRunManagerEventStatus: string;

  /* BSSH Fastq Copy Events */
  workflowRunStateChangeDetailType: string;
  workflowManagerEventSource: string;
  bsshFastqToAwsCopyWorkflowName: string;
  bsshFastqToAwsCopyWorkflowStatus: string;

  /* Stack event stuff */
  fastqListRowsAddedDetailType: string;
  stackEventSource: string;

  /*
    S3 Stuff - some lambdas will need permissions to read from the bucket
    */
  awsS3CacheBucketName: string;
  awsS3PrimaryDataPrefix: string;
}

/** Lambda Interfaces **/
export type LambdaNameList =
  | 'addReadSetsToFastqObjects'
  | 'createFastqSetObject'
  | 'getBclconvertDataFromSamplesheet'
  | 'getFastqObjects'
  | 'getFileNamesFromFastqListCsv'
  | 'getLibraryIdListFromSamplesheet'
  | 'getSampleDemultiplexStats';

export const lambdaNameList: Array<LambdaNameList> = [
  'addReadSetsToFastqObjects',
  'createFastqSetObject',
  'getBclconvertDataFromSamplesheet',
  'getFastqObjects',
  'getFileNamesFromFastqListCsv',
  'getLibraryIdListFromSamplesheet',
  'getSampleDemultiplexStats',
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
};

/* Step Function interfaces */
export type SfnNameList = 'fastqSetAddReadSet' | 'fastqSetGeneration';

export const sfnNameList: Array<SfnNameList> = ['fastqSetAddReadSet', 'fastqSetGeneration'];

export interface SfnProps {
  /* Naming formation */
  stateMachineName: SfnNameList;
}

export interface SfnObject extends SfnProps {
  /* The state machine object */
  stateMachineObj: StateMachine;
}

export const fastqSetGenerationLambdaList: Array<LambdaNameList> = [
  'getLibraryIdListFromSamplesheet',
  'getBclconvertDataFromSamplesheet',
  'createFastqSetObject',
];

export const fastqSetAddReadSetLambdaList: Array<LambdaNameList> = [
  'addReadSetsToFastqObjects',
  'getLibraryIdListFromSamplesheet',
  'getFastqObjects',
  'getFileNamesFromFastqListCsv',
  'getSampleDemultiplexStats',
];

export interface SfnRequirementsProps {
  /* Lambdas */
  requiredLambdaNameList?: LambdaNameList[];

  /* Event stuff */
  needsPutEvents?: boolean;
}

export const SfnRequirementsMapType: { [key in SfnNameList]: SfnRequirementsProps } = {
  // Fastq Set Generation SFN requirements
  fastqSetGeneration: {
    /* Lambdas */
    requiredLambdaNameList: fastqSetGenerationLambdaList,
  },
  // Fastq Set Add Read Set SFN requirements
  fastqSetAddReadSet: {
    /* Lambdas */
    requiredLambdaNameList: fastqSetAddReadSetLambdaList,

    /* Event stuff */
    needsPutEvents: true,
  },
};

export interface BuildSfnProps extends SfnProps {
  /* Lambdas */
  lambdas?: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;
  fastqListRowsAddedDetailType: string;
  stackEventSource: string;
}

export interface BuildSfnsProps {
  /* Lambdas */
  lambdas?: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;
  fastqListRowsAddedDetailType: string;
  stackEventSource: string;
}

export interface WirePermissionsProps extends BuildSfnProps {
  stateMachineObj: StateMachine;
}

export type EventBridgeNameList = 'listenSrmSucceededRule' | 'listenBsshFastqCopySucceededRule';

export const eventBridgeNameList: EventBridgeNameList[] = [
  /* Listen to bclconvert workflow status changes */
  'listenSrmSucceededRule',
  /* Listen to bssh Fastq Copy Ready rule */
  'listenBsshFastqCopySucceededRule',
];

/* EventBridge Interfaces */
export interface EventBridgeRuleProps {
  /* Rule name */
  ruleName: string;

  /* Event bus */
  eventBus: IEventBus;

  /* Event Detail Type */
  eventDetailType: string;
  eventSource: string;

  /* Event Status */
  eventStatus: string;
}

export interface WorkflowRunStateChangeRuleProps extends EventBridgeRuleProps {
  /* We also require the workflow name for both rules */
  workflowName?: string;
}

export type SequenceRunManagerRuleProps = EventBridgeRuleProps;

export interface EventBridgeRulesProps {
  /* EventBridge Rules */
  eventBus: IEventBus;

  /* SRM Events */
  sequenceRunManagerStateChangeDetailType: string;
  sequenceRunManagerEventSource: string;
  sequenceRunManagerEventStatus: string;

  /* BSSH Fastq Copy Events */
  bsshFastqCopyToAwsWorkflowName: string;
  bsshFastqToAwsCopyWorkflowStatus: string;
  workflowRunStateChangeDetailType: string;
  workflowManagerEventSource: string;
}

export interface EventBridgeRuleObject {
  ruleName: EventBridgeNameList;
  ruleObject: Rule;
}

export type EventBridgeTargetsNameList =
  | 'sequenceRunManagerSucceededToFastqSetGenerationSfn'
  | 'bsshFastqCopySucceededToFastqSetAddReadSetSfn';

export const eventBridgeTargetsNameList: Array<EventBridgeTargetsNameList> = [
  'sequenceRunManagerSucceededToFastqSetGenerationSfn',
  'bsshFastqCopySucceededToFastqSetAddReadSetSfn',
];

export interface AddSfnAsEventBridgeTargetProps {
  stateMachineObj: StateMachine;
  eventBridgeRuleObj: Rule;
}

export interface EventBridgeTargetsProps {
  eventBridgeRuleObjects: EventBridgeRuleObject[];
  stepFunctionObjects: SfnObject[];
}
