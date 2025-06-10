import { IEventBus, Rule } from 'aws-cdk-lib/aws-events';

export type EventBridgeNameList =
  | 'listenSrmSucceededRule'
  | 'listenBsshFastqCopySucceededRule'
  // Legacy rules
  | 'listenFastqGlueFastqListRowsAdded'
  | 'listenFastqGlueReadSetsAdded';

export const eventBridgeNameList: EventBridgeNameList[] = [
  /* Listen to bclconvert workflow status changes */
  'listenSrmSucceededRule',
  /* Listen to bssh Fastq Copy Ready rule */
  'listenBsshFastqCopySucceededRule',
  /* Legacy rules */
  // Clag - add library events rule
  'listenFastqGlueFastqListRowsAdded',
  'listenFastqGlueReadSetsAdded',
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
}

export interface EventBridgeRulePropsWithStatus extends EventBridgeRuleProps {
  /* Event Status */
  eventStatus: string;
}

export interface WorkflowRunStateChangeRuleProps extends EventBridgeRulePropsWithStatus {
  /* We also require the workflow name for both rules */
  workflowName?: string;
}

export type SequenceRunManagerRuleProps = EventBridgeRulePropsWithStatus;

export type FastqListRowAddedRuleProps = EventBridgeRuleProps;
export type ReadSetsAddedRuleProps = EventBridgeRuleProps;

export interface EventBridgeRulesProps {
  /* EventBridge Rules */
  eventBus: IEventBus;
}

export interface EventBridgeRuleObject {
  ruleName: EventBridgeNameList;
  ruleObject: Rule;
}
