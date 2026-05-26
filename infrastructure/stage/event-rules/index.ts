import {
  eventBridgeNameList,
  EventBridgeRuleObject,
  EventBridgeRulesProps,
  MultiWorkflowRunStateChangeRuleProps,
  ReadSetsAddedRuleProps,
  SequenceRunSampleSheetStateChangeRuleProps,
  SequenceRunStateChangeRuleProps,
  WorkflowRunStateChangeRuleProps,
} from './interfaces';
import { Rule } from 'aws-cdk-lib/aws-events';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import {
  BSSH_TO_AWS_S3_COPY_STATUS,
  BSSH_TO_AWS_S3_COPY_WORKFLOW_NAME,
  DRAGEN_TSO500_CTDNA_WORKFLOW_NAME,
  DRAGEN_WGTS_DNA_WORKFLOW_NAME,
  DRAGEN_WGTS_RNA_WORKFLOW_NAME,
  READ_SETS_ADDED_EVENT_DETAIL_TYPE,
  SEQUENCE_RUN_MANAGER_EVENT_SOURCE,
  SEQUENCE_RUN_MANAGER_FAILURE_STATUS,
  SEQUENCE_RUN_MANAGER_SAMPLESHEET_CHANGE_DETAIL_TYPE,
  SEQUENCE_RUN_MANAGER_STATE_CHANGE_DETAIL_TYPE,
  STACK_PREFIX,
  STACK_SOURCE,
  WORKFLOW_MANAGER_EVENT_SOURCE,
  WORKFLOW_RUN_STATE_CHANGE_EVENT_DETAIL_TYPE,
} from '../constants';

/*
Remember to put this link into all event rule scripts to help with the event pattern operators:
https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-pattern-operators.html
*/

function buildSequenceRunManagerStateChangeEventRule(
  scope: Construct,
  props: SequenceRunSampleSheetStateChangeRuleProps
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

function buildSequenceRunManagerFailureEventRule(
  scope: Construct,
  props: SequenceRunStateChangeRuleProps
): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}--${props.ruleName}`,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
      detail: {
        status: [props.status],
      },
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
      },
    },
    eventBus: props.eventBus,
  });
}

function buildReadSetsAddedRule(scope: Construct, props: ReadSetsAddedRuleProps): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}--${props.ruleName}`,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
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
      case 'listenSrmSampleSheetStateChangeRule': {
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
      /* SRM Failure Rule */
      case 'listenSrmStateChangeFailureRule': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildSequenceRunManagerFailureEventRule(scope, {
            ruleName: ruleName,
            eventSource: SEQUENCE_RUN_MANAGER_EVENT_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: SEQUENCE_RUN_MANAGER_STATE_CHANGE_DETAIL_TYPE,
            status: SEQUENCE_RUN_MANAGER_FAILURE_STATUS,
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
          }),
        });
        break;
      }
      /* listenReadsetsAddedRule */
      case 'listenReadsetsAddedRule': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildReadSetsAddedRule(scope, {
            ruleName: ruleName,
            eventSource: STACK_SOURCE, // This is from within!
            eventDetailType: READ_SETS_ADDED_EVENT_DETAIL_TYPE,
            eventBus: props.eventBus,
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
