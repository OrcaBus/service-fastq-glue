import {
  eventBridgeNameList,
  EventBridgeRuleObject,
  EventBridgeRulesProps,
  MultiWorkflowRunStateChangeRuleProps,
  SequenceRunManagerRuleProps,
  WorkflowRunStateChangeRuleProps,
} from './interfaces';
import { Rule } from 'aws-cdk-lib/aws-events';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import {
  AUTOMATED_WORKFLOW_PREFIX,
  BSSH_TO_AWS_S3_COPY_STATUS,
  BSSH_TO_AWS_S3_COPY_WORKFLOW_NAME,
  DRAGEN_TSO500_CTDNA_WORKFLOW_NAME,
  DRAGEN_WGTS_DNA_WORKFLOW_NAME,
  DRAGEN_WGTS_RNA_WORKFLOW_NAME,
  SEQUENCE_RUN_MANAGER_EVENT_SOURCE,
  SEQUENCE_RUN_MANAGER_SAMPLESHEET_CHANGE_DETAIL_TYPE,
  STACK_PREFIX,
  WORKFLOW_MANAGER_EVENT_SOURCE,
  WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE,
} from '../constants';

/*
Remember to put this link into all event rule scripts to help with the event pattern operators:
https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-pattern-operators.html
*/

function buildSequenceRunManagerStateChangeEventRule(
  scope: Construct,
  props: SequenceRunManagerRuleProps
): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}--${props.ruleName}`,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
    },
    eventBus: props.eventBus,
  });
}

function buildWorkflowRunStateChangeEventRule(
  scope: Construct,
  props: WorkflowRunStateChangeRuleProps
): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}--${props.ruleName}`,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
      detail: {
        status: [{ 'equals-ignore-case': props.eventStatus }],
        workflow: {
          name: [{ 'equals-ignore-case': props.workflowName }],
        },
        workflowRunName: [
          {
            prefix: props.workflowRunNamePrefix,
          },
        ],
      },
    },
    eventBus: props.eventBus,
  });
}

function buildMultiWorkflowWorkflowRunStateChangeEventRule(
  scope: Construct,
  props: MultiWorkflowRunStateChangeRuleProps
): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}--${props.ruleName}`,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
      detail: {
        status: [{ 'equals-ignore-case': props.eventStatus }],
        workflow: {
          // For each workflow name in the array, create an 'equals-ignore-case' condition
          name: [...props.workflowNameList.map((name) => ({ 'equals-ignore-case': name }))],
        },
      },
    },
    eventBus: props.eventBus,
  });
}

export function buildAllEventRules(
  scope: Construct,
  props: EventBridgeRulesProps
): EventBridgeRuleObject[] {
  const eventBridgeRuleObjects: EventBridgeRuleObject[] = [];

  // Iterate over the eventBridgeNameList and create the event rules
  for (const ruleName of eventBridgeNameList) {
    switch (ruleName) {
      /* SRM SampleSheet State Change */
      case 'listenSrmSampleSheetStateChange': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildSequenceRunManagerStateChangeEventRule(scope, {
            ruleName: ruleName,
            eventSource: SEQUENCE_RUN_MANAGER_EVENT_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: SEQUENCE_RUN_MANAGER_SAMPLESHEET_CHANGE_DETAIL_TYPE,
          }),
        });
        break;
      }
      /* BSSH Fastq Copy Succeeded Rule */
      case 'listenBsshFastqCopySucceededRule': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildWorkflowRunStateChangeEventRule(scope, {
            ruleName: ruleName,
            eventSource: WORKFLOW_MANAGER_EVENT_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE,
            eventStatus: BSSH_TO_AWS_S3_COPY_STATUS,
            workflowName: BSSH_TO_AWS_S3_COPY_WORKFLOW_NAME,
            workflowRunNamePrefix: AUTOMATED_WORKFLOW_PREFIX,
          }),
        });
        break;
      }
      /* Workflow Bam Rules */
      case 'listenWorkflowWithBamRule': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildMultiWorkflowWorkflowRunStateChangeEventRule(scope, {
            ruleName: ruleName,
            eventSource: WORKFLOW_MANAGER_EVENT_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE,
            eventStatus: 'SUCCEEDED',
            workflowNameList: [
              DRAGEN_WGTS_DNA_WORKFLOW_NAME,
              DRAGEN_WGTS_RNA_WORKFLOW_NAME,
              DRAGEN_TSO500_CTDNA_WORKFLOW_NAME,
            ],
          }),
        });
        break;
      }
    }
  }

  // Return the event bridge rule objects
  return eventBridgeRuleObjects;
}
