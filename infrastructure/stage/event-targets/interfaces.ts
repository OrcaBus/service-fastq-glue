import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Rule } from 'aws-cdk-lib/aws-events';
import { EventBridgeRuleObject } from '../event-rules/interfaces';
import { SfnObject } from '../step-functions/interfaces';

export type EventBridgeTargetsNameList =
  | 'sequenceRunManagerSucceededToFastqSetGenerationSfn'
  | 'legacyBsshFastqCopySucceededToFastqSetAddReadSetSfn'
  | 'bsshFastqCopySucceededToFastqSetAddReadSetSfn'
  // Legacy EventBridge targets
  | 'fastqGlueFastqSetsAddedEventToStackyGenerateLibraryEventsSfn'
  | 'fastqGlueReadSetsAddedEventToStackyGenerateFqlrsEventsSfn';

export const eventBridgeTargetsNameList: Array<EventBridgeTargetsNameList> = [
  'sequenceRunManagerSucceededToFastqSetGenerationSfn',
  'legacyBsshFastqCopySucceededToFastqSetAddReadSetSfn',
  'bsshFastqCopySucceededToFastqSetAddReadSetSfn',
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
