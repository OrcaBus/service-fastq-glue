import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Rule } from 'aws-cdk-lib/aws-events';
import { EventBridgeRuleObject } from '../event-rules/interfaces';
import { SfnObject } from '../step-functions/interfaces';

export type EventBridgeTargetsNameList =
  // Pre BCLConvert
  | 'sequenceRunManagerSucceededToFastqSetGenerationSfn'
  // Post BCLConvert - Pre Staging
  | 'bsshFastqCopySucceededToFastqSetAddReadSetSfn'
  // Post Staging - Analysis
  | 'listenWorkflowWithBamRuleToTriggerSomalierExtractSfn'
  // Legacy EventBridge targets
  | 'fastqGlueFastqSetsAddedEventToStackyGenerateLibraryEventsSfn'
  | 'fastqGlueReadSetsAddedEventToStackyGenerateFqlrsEventsSfn';

export const eventBridgeTargetsNameList: Array<EventBridgeTargetsNameList> = [
  // Pre BCLConvert
  'sequenceRunManagerSucceededToFastqSetGenerationSfn',
  // Post BCLConvert - Pre Staging
  'bsshFastqCopySucceededToFastqSetAddReadSetSfn',
  // Post Staging - Analysis
  'listenWorkflowWithBamRuleToTriggerSomalierExtractSfn',
  // Legacy EventBridge targets
  'fastqGlueFastqSetsAddedEventToStackyGenerateLibraryEventsSfn',
  'fastqGlueReadSetsAddedEventToStackyGenerateFqlrsEventsSfn',
];

export interface AddSfnAsEventBridgeTargetProps {
  stateMachineObj: StateMachine;
  eventBridgeRuleObj: Rule;
}

export interface EventBridgeTargetsProps {
  eventBridgeRuleObjects: EventBridgeRuleObject[];
  stepFunctionObjects: SfnObject[];
}
