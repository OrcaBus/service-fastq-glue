import {
  eventBridgeNameList,
  EventBridgeRuleObject,
  EventBridgeRulesProps,
  FastqListRowAddedRuleProps,
  ReadSetsAddedRuleProps,
  SequenceRunManagerRuleProps,
  WorkflowRunStateChangeRuleProps,
} from './interfaces';
import { Rule } from 'aws-cdk-lib/aws-events';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import {
  BSSH_TO_AWS_S3_COPY_STATUS,
  BSSH_TO_AWS_S3_COPY_WORKFLOW_NAME,
  FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE,
  READ_SETS_ADDED_EVENT_DETAIL_TYPE,
  SEQUENCE_RUN_MANAGER_EVENT_SOURCE,
  SEQUENCE_RUN_MANAGER_EVENT_STATUS,
  SEQUENCE_RUN_MANAGER_STATE_CHANGE_EVENT_DETAIL_TYPE,
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
  props: SequenceRunManagerRuleProps
): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}--${props.ruleName}`,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
      detail: {
        status: [{ 'equals-ignore-case': props.eventStatus }],
      },
    },
    eventBus: props.eventBus,
  });
}

function buildWorkflowRunStateChangeLegacyEventRule(
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
        workflowName: [{ 'equals-ignore-case': props.workflowName }],
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

function buildFastqGlueFastqListRowsAddedEventRule(
  scope: Construct,
  props: FastqListRowAddedRuleProps
): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}--${props.ruleName}`,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
      detail: {
        instrumentRunId: [{ exists: true }],
      },
    },
    eventBus: props.eventBus,
  });
}

function buildFastqGlueReadSetsAddedEventRule(
  scope: Construct,
  props: ReadSetsAddedRuleProps
): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}--${props.ruleName}`,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
      detail: {
        instrumentRunId: [{ exists: true }],
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
      case 'listenSrmSucceededRule': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildSequenceRunManagerStateChangeEventRule(scope, {
            ruleName: ruleName,
            eventSource: SEQUENCE_RUN_MANAGER_EVENT_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: SEQUENCE_RUN_MANAGER_STATE_CHANGE_EVENT_DETAIL_TYPE,
            eventStatus: SEQUENCE_RUN_MANAGER_EVENT_STATUS,
          }),
        });
        break;
      }
      case 'listenLegacyBsshFastqCopySucceededRule': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildWorkflowRunStateChangeLegacyEventRule(scope, {
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
      case 'listenFastqGlueFastqListRowsAdded': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildFastqGlueFastqListRowsAddedEventRule(scope, {
            ruleName: ruleName,
            eventSource: STACK_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE,
          }),
        });
        break;
      }
      case 'listenFastqGlueReadSetsAdded': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildFastqGlueReadSetsAddedEventRule(scope, {
            ruleName: ruleName,
            eventSource: STACK_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: READ_SETS_ADDED_EVENT_DETAIL_TYPE,
          }),
        });
        break;
      }
    }
  }

  // Return the event bridge rule objects
  return eventBridgeRuleObjects;
}
