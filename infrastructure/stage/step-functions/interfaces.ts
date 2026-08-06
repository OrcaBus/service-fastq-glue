/* Step Function interfaces */
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { LambdaNameList, LambdaObject } from '../lambdas/interfaces';

export type SfnName =
  // Pre BCLConvert
  | 'fastqSetGeneration'
  // Handle SRM failure
  | 'handleSequencingRunFailure'
  // Post BCLConvert - BSSH Copy
  | 'fastqSetAddReadSet'
  // Post-analysis
  | 'triggerSomalierExtract'
  // Post-post analysis
  | 'addMissingFingerprints'
  // BCL archiving
  | 'sequencingRunBclArchiving'
  // FASTQ archiving
  | 'sequencingRunFastqArchiving';

export const sfnNameList: Array<SfnName> = [
  // Pre BCLConvert
  'fastqSetGeneration',
  // Handle SRM failure
  'handleSequencingRunFailure',
  // Post BCLConvert - BSSH Copy
  'fastqSetAddReadSet',
  // Post-analysis
  'triggerSomalierExtract',
  // Post-post-analysis
  'addMissingFingerprints',
  // BCL archiving
  'sequencingRunBclArchiving',
  // FASTQ archiving
  'sequencingRunFastqArchiving',
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

export const handleSequencingRunFailureLambdaList: Array<LambdaNameList> = [
  'getFastqAndFastqSetIdsFromInstrumentRunId',
  'unlinkFastqFromFastqSet',
  'invalidateFastq',
];

export const triggerSomalierExtractLambdaList: Array<LambdaNameList> = [
  'getBamByLibraryId',
  'runExtractFingerprint',
  'getFastqSetIdByLibrary',
];

export const addMissingFingerprintsLambdaList: Array<LambdaNameList> = [
  'findMissingFingerprints',
  'runExtractFingerprint',
];

export const sequencingRunBclArchivingLambdaList: Array<LambdaNameList> = [
  'deleteBasespaceRunData',
];

export const sequencingRunFastqArchivingLambdaList: Array<LambdaNameList> = [
  'getFastqCopyOutputUri',
  'getArchiveDestinationUri',
];

export interface SfnRequirementsProps {
  /* Lambdas */
  requiredLambdaNameList?: LambdaNameList[];

  /* Event stuff */
  needsPutEvents?: boolean;

  /* Sfn specific */
  needsDistributedMapPolicy?: boolean;

  /* Needs to start an external SFN */
  needsStartExternalSfn?: boolean;
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
  // Handle SRM failure
  handleSequencingRunFailure: {
    /* Lambdas */
    requiredLambdaNameList: handleSequencingRunFailureLambdaList,

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
  // Post-post analysis
  addMissingFingerprints: {
    /* Lambdas */
    requiredLambdaNameList: addMissingFingerprintsLambdaList,
    /* Sfn specific */
    needsDistributedMapPolicy: true,
  },
  // BCL archiving
  sequencingRunBclArchiving: {
    /* Lambdas */
    requiredLambdaNameList: sequencingRunBclArchivingLambdaList,

    /* Event stuff */
    needsPutEvents: true,
  },
  // FASTQ archiving
  sequencingRunFastqArchiving: {
    /* Lambdas */
    requiredLambdaNameList: sequencingRunFastqArchivingLambdaList,

    /* Event stuff */
    needsPutEvents: true,

    /* Needs to start external data-mover SFN */
    needsStartExternalSfn: true,
  },
};

export interface BuildSfnProps extends SfnProps {
  /* Lambdas */
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;

  /* External SFN ARN (e.g., data-mover) */
  dataMoverSfnArn?: string;
}

export interface BuildSfnsProps {
  /* Lambdas */
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;

  /* External SFN ARN (e.g., data-mover) */
  dataMoverSfnArn?: string;
}

export interface WirePermissionsProps extends BuildSfnProps {
  stateMachineObj: StateMachine;
}
