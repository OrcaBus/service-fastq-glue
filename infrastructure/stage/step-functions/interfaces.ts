/* Step Function interfaces */
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { LambdaNameList, LambdaObject } from '../lambdas/interfaces';

export type SfnNameList =
  | 'fastqSetAddReadSet'
  | 'fastqSetGeneration'
  | 'stackyGenerateLibraryEvent'
  | 'stackyGenerateFastqListRowEvent';

export const sfnNameList: Array<SfnNameList> = [
  'fastqSetAddReadSet',
  'fastqSetGeneration',
  'stackyGenerateLibraryEvent',
  'stackyGenerateFastqListRowEvent',
];

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

export const stackyGenerateLibraryEventLambdaList: Array<LambdaNameList> = [
  'getLibraryIdListFromSamplesheet',
  'getLibraryObjectsFromLibraryIdList',
  'getFastqListRowObjectsFromLibraryIdList',
];

export const stackyGenerateFastqListRowEventLambdaList: Array<LambdaNameList> = [
  'getLibraryIdListFromSamplesheet',
  'getFastqListRowsFromFastqSetId',
  'getFastqSetIdListForLibraries',
];

export interface SfnRequirementsProps {
  /* Lambdas */
  requiredLambdaNameList?: LambdaNameList[];

  /* Event stuff */
  needsPutEvents?: boolean;

  /* Sfn specific */
  needsDistributedMapPolicy?: boolean;
}

export const SfnRequirementsMapType: { [key in SfnNameList]: SfnRequirementsProps } = {
  // Fastq Set Generation SFN requirements
  fastqSetGeneration: {
    /* Lambdas */
    requiredLambdaNameList: fastqSetGenerationLambdaList,

    /* Event stuff */
    needsPutEvents: true,

    /* Sfn specific */
    needsDistributedMapPolicy: true,
  },
  // Fastq Set Add Read Set SFN requirements
  fastqSetAddReadSet: {
    /* Lambdas */
    requiredLambdaNameList: fastqSetAddReadSetLambdaList,

    /* Event stuff */
    needsPutEvents: true,

    /* Sfn specific */
    needsDistributedMapPolicy: true,
  },
  // Legacy SFNs
  stackyGenerateLibraryEvent: {
    /* Lambdas */
    requiredLambdaNameList: stackyGenerateLibraryEventLambdaList,

    /* Event stuff */
    needsPutEvents: true,

    /* Sfn specific */
    needsDistributedMapPolicy: true,
  },
  stackyGenerateFastqListRowEvent: {
    /* Lambdas */
    requiredLambdaNameList: stackyGenerateFastqListRowEventLambdaList,

    /* Event stuff */
    needsPutEvents: true,

    /* Sfn specific */
    needsDistributedMapPolicy: true,
  },
};

export interface BuildSfnProps extends SfnProps {
  /* Lambdas */
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;
}

export interface BuildSfnsProps {
  /* Lambdas */
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;
}

export interface WirePermissionsProps extends BuildSfnProps {
  stateMachineObj: StateMachine;
}
