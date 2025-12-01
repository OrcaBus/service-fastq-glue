/* Step Function interfaces */
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { LambdaNameList, LambdaObject } from '../lambdas/interfaces';

export type SfnName =
  // Pre BCLConvert
  | 'fastqSetGeneration'
  // Post BCLConvert - BSSH Copy
  | 'fastqSetAddReadSet'
  // Post-analysis
  | 'triggerSomalierExtract';

export const sfnNameList: Array<SfnName> = [
  // Pre BCLConvert
  'fastqSetGeneration',
  // Post BCLConvert - BSSH Copy
  'fastqSetAddReadSet',
  // Post-analysis
  'triggerSomalierExtract',
];

export interface SfnProps {
  /* Naming formation */
  stateMachineName: SfnName;
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

export const triggerSomalierExtractLambdaList: Array<LambdaNameList> = [
  'getBamByLibraryId',
  'runExtractFingerprint',
  'getFastqSetIdByLibrary',
];

export interface SfnRequirementsProps {
  /* Lambdas */
  requiredLambdaNameList?: LambdaNameList[];

  /* Event stuff */
  needsPutEvents?: boolean;

  /* Sfn specific */
  needsDistributedMapPolicy?: boolean;
}

export const SfnRequirementsMapType: { [key in SfnName]: SfnRequirementsProps } = {
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
  // Post-analysis SFN requirements
  triggerSomalierExtract: {
    /* Lambdas */
    requiredLambdaNameList: triggerSomalierExtractLambdaList,
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
