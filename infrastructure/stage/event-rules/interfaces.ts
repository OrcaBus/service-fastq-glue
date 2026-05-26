import { IEventBus, Rule } from 'aws-cdk-lib/aws-events';

export type EventBridgeNameList =
  /* Listen to Srm SampleSheet status changes */
  | 'listenSrmSampleSheetStateChangeRule'
  /* Listen to Srm State Change Failures */
  | 'listenSrmStateChangeFailureRule'
  /* Listen to bssh Fastq Copy Ready rule */
  | 'listenBsshFastqCopySucceededRule'
  /* Listen to readsets added rule */
  | 'listenReadsetsAddedRule'
  /* Dragen WGTS DNA / TSO500 ctDNA */
  | 'listenWorkflowWithBamRule';

export const eventBridgeNameList: EventBridgeNameList[] = [
  /* Listen to Srm SampleSheet status changes */
  'listenSrmSampleSheetStateChangeRule',
  /* Listen to Srm State Change Failures */
  'listenSrmStateChangeFailureRule',
  /* Listen to bssh Fastq Copy Ready rule */
  'listenBsshFastqCopySucceededRule',
  /* Listen to readsets added rule */
  'listenReadsetsAddedRule',
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

export type ReadSetsAddedRuleProps = EventBridgeRuleProps;

export interface WorkflowRunStateChangeRuleProps extends EventBridgeRulePropsWithStatus {
  /* We also require the workflow name for both rules */
  workflowName: string;
  workflowRunNamePrefix: string;
}

export type SequenceRunSampleSheetStateChangeRuleProps = EventBridgeRuleProps;
export interface SequenceRunStateChangeRuleProps extends EventBridgeRuleProps {
  /* We also require a status */
  status: string;
}

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
