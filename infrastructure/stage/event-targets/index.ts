import {
  AddSfnAsEventBridgeTargetProps,
  eventBridgeTargetsNameList,
  EventBridgeTargetsProps,
} from './interfaces';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import { EventField, RuleTargetInput } from 'aws-cdk-lib/aws-events';

function buildSrmSucceededToFastqSetGenerationSfnEventBridgeTarget(
  props: AddSfnAsEventBridgeTargetProps
): void {
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: RuleTargetInput.fromObject({
        instrumentRunId: EventField.fromPath('$.detail.instrumentRunId'),
      }),
    })
  );
}

function buildBsshFastqCopySucceededToFastqSetAddReadSetEventBridgeTarget(
  props: AddSfnAsEventBridgeTargetProps
): void {
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: RuleTargetInput.fromObject({
        outputUri: EventField.fromPath('$.detail.payload.data.engineParameters.outputUri'),
        instrumentRunId: EventField.fromPath('$.detail.payload.data.tags.instrumentRunId'),
      }),
    })
  );
}

function buildFastqSetsAddedToGenerateLibraryEventsEventBridgeTarget(
  props: AddSfnAsEventBridgeTargetProps
): void {
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: RuleTargetInput.fromObject({
        instrumentRunId: EventField.fromPath('$.detail.instrumentRunId'),
      }),
    })
  );
}

function buildFastqReadSetsAddedToGenerateFqlrEventBridgeTarget(
  props: AddSfnAsEventBridgeTargetProps
): void {
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: RuleTargetInput.fromObject({
        instrumentRunId: EventField.fromPath('$.detail.instrumentRunId'),
      }),
    })
  );
}

export function buildAllEventBridgeTargets(props: EventBridgeTargetsProps) {
  for (const eventBridgeTargetsName of eventBridgeTargetsNameList) {
    switch (eventBridgeTargetsName) {
      // SRM events
      case 'sequenceRunManagerSucceededToFastqSetGenerationSfn': {
        buildSrmSucceededToFastqSetGenerationSfnEventBridgeTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'listenSrmSampleSheetStateChange'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) => eventBridgeObject.stateMachineName === 'fastqSetGeneration'
          )?.stateMachineObj,
        });
        break;
      }

      // BSSH to AWS WRSC Events
      case 'legacyBsshFastqCopySucceededToFastqSetAddReadSetSfn': {
        buildBsshFastqCopySucceededToFastqSetAddReadSetEventBridgeTarget(<
          AddSfnAsEventBridgeTargetProps
        >{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.ruleName === 'listenLegacyBsshFastqCopySucceededRule'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) => eventBridgeObject.stateMachineName === 'fastqSetAddReadSet'
          )?.stateMachineObj,
        });
        break;
      }
      case 'bsshFastqCopySucceededToFastqSetAddReadSetSfn': {
        buildBsshFastqCopySucceededToFastqSetAddReadSetEventBridgeTarget(<
          AddSfnAsEventBridgeTargetProps
        >{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'listenBsshFastqCopySucceededRule'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) => eventBridgeObject.stateMachineName === 'fastqSetAddReadSet'
          )?.stateMachineObj,
        });
        break;
      }

      // Fastq Glue Internal Events (for legacy workflows)
      case 'fastqGlueFastqSetsAddedEventToStackyGenerateLibraryEventsSfn': {
        buildFastqSetsAddedToGenerateLibraryEventsEventBridgeTarget(<
          AddSfnAsEventBridgeTargetProps
        >{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.ruleName === 'listenFastqGlueFastqListRowsAdded'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.stateMachineName === 'stackyGenerateLibraryEvent'
          )?.stateMachineObj,
        });
        break;
      }
      case 'fastqGlueReadSetsAddedEventToStackyGenerateFqlrsEventsSfn': {
        buildFastqReadSetsAddedToGenerateFqlrEventBridgeTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'listenFastqGlueReadSetsAdded'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.stateMachineName === 'stackyGenerateFastqListRowEvent'
          )?.stateMachineObj,
        });
        break;
      }
    }
  }
}
