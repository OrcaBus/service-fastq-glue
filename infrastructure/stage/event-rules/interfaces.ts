import { IEventBus, Rule } from 'aws-cdk-lib/aws-events';

export type EventBridgeNameList =
  /* Listen to Srm SampleSheet status changes */
  | 'listenSrmSampleSheetStateChange'
  /* Listen to bssh Fastq Copy Ready rule */
  | 'listenBsshFastqCopySucceededRule'
  /* Dragen WGTS DNA / TSO500 ctDNA */
  | 'listenWorkflowWithBamRule';

export const eventBridgeNameList: EventBridgeNameList[] = [
  /* Listen to Srm SampleSheet status changes */
  'listenSrmSampleSheetStateChange',
  /* Listen to bssh Fastq Copy Ready rule */
  'listenBsshFastqCopySucceededRule',
  /* Listen to Workflow with Bam rule */
  'listenWorkflowWithBamRule',
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

export type SequenceRunManagerRuleProps = EventBridgeRuleProps;

export interface MultiWorkflowRunStateChangeRuleProps extends EventBridgeRulePropsWithStatus {
  /* We also require the workflow name for both rules */
  workflowNameList: string[];
}

export interface EventBridgeRulesProps {
  /* EventBridge Rules */
  eventBus: IEventBus;
}

export interface EventBridgeRuleObject {
  ruleName: EventBridgeNameList;
  ruleObject: Rule;
}
