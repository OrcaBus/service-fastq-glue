// Standard cdk imports
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {
  AddSfnAsEventBridgeTargetProps,
  BuildLambdaProps,
  BuildLambdasProps,
  BuildSfnProps,
  BuildSfnsProps,
  eventBridgeNameList,
  EventBridgeRuleObject,
  EventBridgeRulesProps,
  eventBridgeTargetsNameList,
  EventBridgeTargetsProps,
  lambdaNameList,
  LambdaObject,
  lambdaToRequirementsMap,
  SequenceRunManagerRuleProps,
  sfnNameList,
  SfnObject,
  SfnRequirementsMapType,
  StatelessApplicationStackConfig,
  WirePermissionsProps,
  WorkflowRunStateChangeRuleProps,
} from './interfaces';
import * as events from 'aws-cdk-lib/aws-events';
import { LAMBDA_DIR, STEP_FUNCTIONS_DIR } from './constants';
import { EventField, Rule, RuleTargetInput } from 'aws-cdk-lib/aws-events';

import path from 'path';
import { PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import { Duration } from 'aws-cdk-lib';

export class ApplicationStatelessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StatelessApplicationStackConfig) {
    super(scope, id, props);

    // Event Bus
    const eventBus = events.EventBus.fromEventBusName(this, 'eventBus', props.eventBusName);

    // Get S3 Bucket
    const s3Bucket = s3.Bucket.fromBucketName(this, 's3Bucket', props.awsS3CacheBucketName);

    // Build Lambdas
    const lambdas = this.buildAllLambdaFunctions({
      s3BucketPrefix: {
        s3Bucket: s3Bucket,
        s3Prefix: props.awsS3PrimaryDataPrefix,
      },
    });

    // Build Step Functions
    const stepFunctionObjects = this.buildAllStepFunctions({
      lambdas: lambdas,
      eventBus: eventBus,
      stackEventSource: props.stackEventSource,
      fastqListRowsAddedDetailType: props.fastqListRowsAddedDetailType,
    });

    // Build Event Rules
    const eventBridgeRuleObjects = this.buildAllEventRules({
      /* Event Bus */
      eventBus: eventBus,

      /* SRM Event Rule stuff */
      sequenceRunManagerEventSource: props.sequenceRunManagerEventSource,
      sequenceRunManagerStateChangeDetailType: props.sequenceRunManagerStateChangeDetailType,
      sequenceRunManagerEventStatus: props.sequenceRunManagerEventStatus,

      /* BSSH Event Rule stuff */
      bsshFastqCopyToAwsWorkflowName: props.bsshFastqToAwsCopyWorkflowName,
      bsshFastqToAwsCopyWorkflowStatus: props.bsshFastqToAwsCopyWorkflowStatus,
      workflowManagerEventSource: props.workflowManagerEventSource,
      workflowRunStateChangeDetailType: props.workflowRunStateChangeDetailType,
    });

    // Build Event Targets
    this.buildAllEventBridgeTargets({
      eventBridgeRuleObjects: eventBridgeRuleObjects,
      stepFunctionObjects: stepFunctionObjects,
    });
  }

  /**
   * Lambda functions
   */
  private buildLambdaFunction(props: BuildLambdaProps): LambdaObject {
    const lambdaNameToSnakeCase = this.camelCaseToSnakeCase(props.lambdaName);
    const lambdaRequirementsMap = lambdaToRequirementsMap[props.lambdaName];

    /* Build the lambda function */
    const lambdaFunction = new PythonUvFunction(this, props.lambdaName, {
      entry: path.join(LAMBDA_DIR, lambdaNameToSnakeCase + '_py'),
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambda.Architecture.ARM_64,
      index: lambdaNameToSnakeCase + '.py',
      handler: 'handler',
      timeout: Duration.seconds(60),
      includeOrcabusApiToolsLayer: lambdaRequirementsMap.needsOrcabusApiToolsLayer,
    });

    /* Do we need the bssh tools layer? */
    if (lambdaRequirementsMap.needsAwsReadAccess) {
      // Grant the lambda read access to the S3 bucket
      props.s3BucketPrefix.s3Bucket.grantRead(
        lambdaFunction.currentVersion,
        props.s3BucketPrefix.s3Prefix
      );
    }

    /* Return the lambda object */
    return {
      lambdaName: props.lambdaName,
      lambdaFunction: lambdaFunction,
    };
  }

  private buildAllLambdaFunctions(props: BuildLambdasProps): LambdaObject[] {
    // Iterate over lambdaNameList and create the lambda functions
    const lambdaObjects: LambdaObject[] = [];
    for (const lambdaName of lambdaNameList) {
      lambdaObjects.push(
        this.buildLambdaFunction({
          lambdaName: lambdaName,
          ...props,
        })
      );
    }

    // Return the lambda objects
    return lambdaObjects;
  }

  /**
   * Step functions
   */

  private createStateMachineDefinitionSubstitutions(props: BuildSfnProps): {
    [key: string]: string;
  } {
    const definitionSubstitutions: { [key: string]: string } = {};

    /* Substitute lambdas in the state machine definition */
    if (props.lambdas) {
      for (const lambdaObject of props.lambdas) {
        const sfnSubtitutionKey = `__${this.camelCaseToSnakeCase(lambdaObject.lambdaName)}_lambda_function_arn__`;
        definitionSubstitutions[sfnSubtitutionKey] =
          lambdaObject.lambdaFunction.currentVersion.functionArn;
      }
    }

    /* Substitute the event bus in the state machine definition */
    if (props.eventBus) {
      definitionSubstitutions['__event_bus_name__'] = props.eventBus.eventBusName;
    }

    /* Substitute the event detail type in the state machine definition */
    if (props.fastqListRowsAddedDetailType) {
      definitionSubstitutions['__fastq_set_created_detail_type__'] =
        props.fastqListRowsAddedDetailType;
    }

    /* Substitute the event source in the state machine definition */
    if (props.stackEventSource) {
      definitionSubstitutions['__stack_event_source__'] = props.stackEventSource;
    }

    return definitionSubstitutions;
  }

  private wireUpStateMachinePermissions(props: WirePermissionsProps): void {
    /* Wire up lambda permissions */
    const sfnRequirements = SfnRequirementsMapType[props.stateMachineName];

    /* Grant invoke on all lambdas required for this state machine */
    if (sfnRequirements.requiredLambdaNameList) {
      for (const lambdaName of sfnRequirements.requiredLambdaNameList) {
        if (!props.lambdas) {
          throw new Error(
            `Lambdas are not defined for state machine that requires them: ${props.stateMachineName}`
          );
        }
        const lambdaObject = props.lambdas.find((lambda) => lambda.lambdaName === lambdaName);
        lambdaObject?.lambdaFunction.currentVersion.grantInvoke(props.stateMachineObj);
      }
    }

    /* Wire up event bus permissions */
    if (sfnRequirements.needsPutEvents) {
      if (!props.eventBus) {
        throw new Error(
          `Event bus is not defined for state machine that requires it: ${props.stateMachineName}`
        );
      }
      props.eventBus.grantPutEventsTo(props.stateMachineObj);
    }
  }

  private buildStepFunction(props: BuildSfnProps): SfnObject {
    const sfnNameToSnakeCase = this.camelCaseToSnakeCase(props.stateMachineName);

    /* Create the state machine definition substitutions */
    const stateMachine = new sfn.StateMachine(this, props.stateMachineName, {
      stateMachineName: props.stateMachineName,
      definitionBody: sfn.DefinitionBody.fromFile(
        path.join(STEP_FUNCTIONS_DIR, sfnNameToSnakeCase + '_sfn_template.asl.json')
      ),
      definitionSubstitutions: this.createStateMachineDefinitionSubstitutions(props),
    });

    /* Grant the state machine permissions */
    this.wireUpStateMachinePermissions({
      stateMachineObj: stateMachine,
      ...props,
    });

    return {
      stateMachineName: props.stateMachineName,
      stateMachineObj: stateMachine,
    };
  }

  private buildAllStepFunctions(props: BuildSfnsProps): SfnObject[] {
    // Initialise the step function objects
    const sfnObjects: SfnObject[] = [];

    // Iterate over the state machine names and create the step functions
    for (const sfnName of sfnNameList) {
      sfnObjects.push(
        this.buildStepFunction({
          stateMachineName: sfnName,
          ...props,
        })
      );
    }

    // Return the step function objects
    return sfnObjects;
  }

  /**
   * Event Bridge Rules
   */
  private buildSequenceRunManagerStateChangeEventRule(props: SequenceRunManagerRuleProps): Rule {
    return new events.Rule(this, props.ruleName, {
      ruleName: props.ruleName,
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

  private buildWorkflowRunStateChangeEventRule(props: WorkflowRunStateChangeRuleProps): Rule {
    return new events.Rule(this, props.ruleName, {
      ruleName: props.ruleName,
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

  private buildAllEventRules(props: EventBridgeRulesProps): EventBridgeRuleObject[] {
    const eventBridgeRuleObjects: EventBridgeRuleObject[] = [];

    // Iterate over the eventBridgeNameList and create the event rules
    for (const ruleName of eventBridgeNameList) {
      switch (ruleName) {
        case 'listenSrmSucceededRule': {
          eventBridgeRuleObjects.push({
            ruleName: ruleName,
            ruleObject: this.buildSequenceRunManagerStateChangeEventRule({
              ruleName: ruleName,
              eventSource: props.workflowManagerEventSource,
              eventBus: props.eventBus,
              eventDetailType: props.workflowRunStateChangeDetailType,
              eventStatus: 'SUCCEEDED',
            }),
          });
          break;
        }
        case 'listenBsshFastqCopySucceededRule': {
          eventBridgeRuleObjects.push({
            ruleName: ruleName,
            ruleObject: this.buildWorkflowRunStateChangeEventRule({
              ruleName: ruleName,
              eventSource: props.workflowManagerEventSource,
              eventBus: props.eventBus,
              eventDetailType: props.workflowRunStateChangeDetailType,
              eventStatus: 'SUCCEEDED',
              workflowName: props.bsshFastqCopyToAwsWorkflowName,
            }),
          });
          break;
        }
      }
    }

    // Return the event bridge rule objects
    return eventBridgeRuleObjects;
  }

  /**
   * Event bridge targets
   */
  private buildSrmSucceededToFastqSetGenerationSfnEventBridgeTarget(
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

  private buildBsshFastqCopySucceededToFastqSetAddReadSetEventBridgeTarget(
    props: AddSfnAsEventBridgeTargetProps
  ): void {
    props.eventBridgeRuleObj.addTarget(
      new eventsTargets.SfnStateMachine(props.stateMachineObj, {
        input: RuleTargetInput.fromObject({
          outputUri: EventField.fromPath('$.detail.payload.data.output.outputUri'),
          instrumentRunId: EventField.fromPath('$.detail.payload.data.output.instrumentRunId'),
        }),
      })
    );
  }

  private buildAllEventBridgeTargets(props: EventBridgeTargetsProps) {
    for (const eventBridgeTargetsName of eventBridgeTargetsNameList) {
      switch (eventBridgeTargetsName) {
        case 'sequenceRunManagerSucceededToFastqSetGenerationSfn': {
          this.buildSrmSucceededToFastqSetGenerationSfnEventBridgeTarget(<
            AddSfnAsEventBridgeTargetProps
          >{
            eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
              (eventBridgeObject) => eventBridgeObject.ruleName === 'listenSrmSucceededRule'
            )?.ruleObject,
            stateMachineObj: props.stepFunctionObjects.find(
              (eventBridgeObject) => eventBridgeObject.stateMachineName === 'fastqSetGeneration'
            )?.stateMachineObj,
          });
          break;
        }
        case 'bsshFastqCopySucceededToFastqSetAddReadSetSfn': {
          this.buildBsshFastqCopySucceededToFastqSetAddReadSetEventBridgeTarget(<
            AddSfnAsEventBridgeTargetProps
          >{
            eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
              (eventBridgeObject) =>
                eventBridgeObject.ruleName === 'listenBsshFastqCopySucceededRule'
            )?.ruleObject,
            stateMachineObj: props.stepFunctionObjects.find(
              (eventBridgeObject) => eventBridgeObject.stateMachineName === 'fastqSetAddReadSet'
            )?.stateMachineObj,
          });
          break;
        }
      }
    }
  }

  /**
   * Random utils
   */
  private camelCaseToSnakeCase(camelCase: string): string {
    return camelCase.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}
