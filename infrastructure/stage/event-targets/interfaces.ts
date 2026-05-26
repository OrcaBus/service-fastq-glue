import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Rule } from 'aws-cdk-lib/aws-events';
import { EventBridgeRuleObject } from '../event-rules/interfaces';
import { SfnObject } from '../step-functions/interfaces';

export type EventBridgeTargetsNameList =
  // Pre BCLConvert
  | 'sequenceRunManagerHasSampleSheetToFastqSetGenerationSfn'
  // Post BCLConvert - Mitigate workflow failure
  | 'sequenceRunManagerFailureToFastqSetMitigation'
  // Post BCLConvert - Pre Staging
  | 'bsshFastqCopySucceededToFastqSetAddReadSetSfn'
  // Post Staging - Analysis
  | 'listenWorkflowWithBamRuleToTriggerSomalierExtractSfn'
  // Post-Post - Analysis
  | 'listenReadSetsAddedToAddMissingFingerprintsSfn';

export const eventBridgeTargetsNameList: Array<EventBridgeTargetsNameList> = [
  // Pre BCLConvert
  'sequenceRunManagerHasSampleSheetToFastqSetGenerationSfn',
  // Post BCLConvert - Mitigate workflow failure
  'sequenceRunManagerFailureToFastqSetMitigation',
  // Post BCLConvert - Pre Staging
  'bsshFastqCopySucceededToFastqSetAddReadSetSfn',
  // Post Staging - Analysis
  'listenWorkflowWithBamRuleToTriggerSomalierExtractSfn',
  // Post-Post - Analysis
  'listenReadSetsAddedToAddMissingFingerprintsSfn',
];

export interface AddSfnAsEventBridgeTargetProps {
  stateMachineObj: StateMachine;
  eventBridgeRuleObj: Rule;
}

export interface EventBridgeTargetsProps {
  eventBridgeRuleObjects: EventBridgeRuleObject[];
  stepFunctionObjects: SfnObject[];
}
