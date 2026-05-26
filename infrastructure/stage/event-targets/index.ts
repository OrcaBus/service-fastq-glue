import {
  AddSfnAsEventBridgeTargetProps,
  eventBridgeTargetsNameList,
  EventBridgeTargetsProps,
} from './interfaces';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import { EventField, RuleTargetInput } from 'aws-cdk-lib/aws-events';

function buildSrmSampleSheetCreationToFastqSetGenerationSfnEventBridgeTarget(
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

function buildSrmFailureToFastqSetGenerationSfnEventBridgeTarget(
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

function buildAddMissingFingerprintsSfnEventBridgeTarget(
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

function buildWorkflowWithBamToTriggerSomalierExtractEventBridgeTarget(
  props: AddSfnAsEventBridgeTargetProps
): void {
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: RuleTargetInput.fromObject({
        workflowRunObj: EventField.fromPath('$.detail'),
      }),
    })
  );
}

export function buildAllEventBridgeTargets(props: EventBridgeTargetsProps) {
  for (const eventBridgeTargetsName of eventBridgeTargetsNameList) {
    switch (eventBridgeTargetsName) {
      // SRM events
      case 'sequenceRunManagerHasSampleSheetToFastqSetGenerationSfn': {
        buildSrmSampleSheetCreationToFastqSetGenerationSfnEventBridgeTarget(<
          AddSfnAsEventBridgeTargetProps
        >{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.ruleName === 'listenSrmSampleSheetStateChangeRule'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) => eventBridgeObject.stateMachineName === 'fastqSetGeneration'
          )?.stateMachineObj,
        });
        break;
      }
      // Post BCLConvert - Mitigate workflow failure
      case 'sequenceRunManagerFailureToFastqSetMitigation': {
        buildSrmFailureToFastqSetGenerationSfnEventBridgeTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'listenSrmStateChangeFailureRule'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.stateMachineName === 'handleSequencingRunFailure'
          )?.stateMachineObj,
        });
        break;
      }
      // BSSH to AWS WRSC Events
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

      // Post analysis Events
      case 'listenWorkflowWithBamRuleToTriggerSomalierExtractSfn': {
        buildWorkflowWithBamToTriggerSomalierExtractEventBridgeTarget(<
          AddSfnAsEventBridgeTargetProps
        >{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'listenWorkflowWithBamRule'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) => eventBridgeObject.stateMachineName === 'triggerSomalierExtract'
          )?.stateMachineObj,
        });
        break;
      }

      // Post-post analysis events
      case 'listenReadSetsAddedToAddMissingFingerprintsSfn': {
        buildAddMissingFingerprintsSfnEventBridgeTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'listenReadsetsAddedRule'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) => eventBridgeObject.stateMachineName === 'addMissingFingerprints'
          )?.stateMachineObj,
        });
        break;
      }
    }
  }
}
