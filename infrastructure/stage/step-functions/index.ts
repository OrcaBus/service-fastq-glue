import {
  BuildSfnProps,
  BuildSfnsProps,
  sfnNameList,
  SfnObject,
  SfnRequirementsMapType,
  WirePermissionsProps,
} from './interfaces';
import { camelCaseToSnakeCase } from '../utils';
import { Construct } from 'constructs';
import {
  END_SAMPLESHEET_SHOWER_PAYLOAD_VERSION,
  FASTQ_LIST_ROW_EVENT_SHOWER_COMPLETE_STATUS,
  FASTQ_LIST_ROW_SHOWER_COMPLETE_PAYLOAD_VERSION,
  FASTQ_LIST_ROW_SHOWER_START_PAYLOAD_VERSION,
  FASTQ_LIST_ROW_SHOWER_START_STATUS,
  FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE,
  FASTQ_SYNC_DETAIL_TYPE,
  LIBRARY_IN_SAMPLESHEET_STATUS,
  NEW_FASTQ_LIST_ROW_PAYLOAD_VERSION,
  NEW_FASTQ_LIST_ROW_STATUS,
  READ_SETS_ADDED_EVENT_DETAIL_TYPE,
  SAMPLESHEET_METADATA_UNION_DETAIL_TYPE,
  SAMPLESHEET_METADATA_UNION_PAYLOAD_VERSION,
  SAMPLESHEET_SHOWER_COMPLETE_STATUS,
  SAMPLESHEET_SHOWER_STARTING_STATUS,
  SAMPLESHEET_SHOWER_STATE_CHANGE_DETAIL_TYPE,
  SFN_PREFIX,
  STACK_EVENT_SOURCE,
  STACKY_FASTQ_LIST_ROW_SHOWER_STATE_CHANGE,
  STACKY_FASTQ_LIST_ROW_STATE_CHANGE,
  START_SAMPLESHEET_SHOWER_PAYLOAD_VERSION,
  STEP_FUNCTIONS_DIR,
} from '../constants';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

function createStateMachineDefinitionSubstitutions(props: BuildSfnProps): {
  [key: string]: string;
} {
  const definitionSubstitutions: { [key: string]: string } = {};

  /* Get the state machine name */
  const sfnName = props.stateMachineName;

  /* Get the statemachine requirements */
  const sfnRequirements = SfnRequirementsMapType[sfnName];

  /* Get the lambda objects required by this state machine
          by filtering props.lambdas for the required lambda names in sfnRequirements.requiredLambdaNameList
      */
  const lambdaObjects = props.lambdas.filter((lambda) =>
    sfnRequirements.requiredLambdaNameList?.includes(lambda.lambdaName)
  );

  /* Substitute lambdas in the state machine definition */
  for (const lambdaObject of lambdaObjects) {
    const sfnSubtitutionKey = `__${camelCaseToSnakeCase(lambdaObject.lambdaName)}_lambda_function_arn__`;
    definitionSubstitutions[sfnSubtitutionKey] =
      lambdaObject.lambdaFunction.currentVersion.functionArn;
  }

  /* Substitute the event bus in the state machine definition */
  if (sfnRequirements.needsPutEvents) {
    definitionSubstitutions['__event_bus_name__'] = props.eventBus.eventBusName;
  }

  /* Substitute the event detail type in the state machine definition */
  definitionSubstitutions['__fastq_set_created_detail_type__'] =
    FASTQ_LIST_ROWS_ADDED_EVENT_DETAIL_TYPE;
  definitionSubstitutions['__read_sets_added_event_detail_type__'] =
    READ_SETS_ADDED_EVENT_DETAIL_TYPE;

  /* Substitute the event source in the state machine definition */
  definitionSubstitutions['__stack_event_source__'] = STACK_EVENT_SOURCE;

  /* Stacky glue substitutions - that we will oneday be able to delete */
  definitionSubstitutions['__samplesheet_shower_started_detail_type__'] =
    SAMPLESHEET_SHOWER_STATE_CHANGE_DETAIL_TYPE;
  definitionSubstitutions['__samplesheet_shower_starting_status__'] =
    SAMPLESHEET_SHOWER_STARTING_STATUS;
  definitionSubstitutions['__start_samplesheet_shower_payload_version__'] =
    START_SAMPLESHEET_SHOWER_PAYLOAD_VERSION;
  definitionSubstitutions['__end_samplesheet_shower_payload_version__'] =
    END_SAMPLESHEET_SHOWER_PAYLOAD_VERSION;
  definitionSubstitutions['__samplesheet_shower_complete_status__'] =
    SAMPLESHEET_SHOWER_COMPLETE_STATUS;
  definitionSubstitutions['__library_in_samplesheet_status__'] = LIBRARY_IN_SAMPLESHEET_STATUS;
  definitionSubstitutions['__samplesheet_metadata_union_payload_version__'] =
    SAMPLESHEET_METADATA_UNION_PAYLOAD_VERSION;
  definitionSubstitutions['__samplesheet_metadata_union_detail_type__'] =
    SAMPLESHEET_METADATA_UNION_DETAIL_TYPE;

  definitionSubstitutions['__fastq_list_row_shower_start_status__'] =
    FASTQ_LIST_ROW_SHOWER_START_STATUS;
  definitionSubstitutions['__fastq_list_row_shower_start_payload_version__'] =
    FASTQ_LIST_ROW_SHOWER_START_PAYLOAD_VERSION;
  definitionSubstitutions['__stacky_fastq_list_row_state_change__'] =
    STACKY_FASTQ_LIST_ROW_STATE_CHANGE;
  definitionSubstitutions['__fastq_sync_detail_type__'] = FASTQ_SYNC_DETAIL_TYPE;
  definitionSubstitutions['__new_fastq_list_row_status__'] = NEW_FASTQ_LIST_ROW_STATUS;
  definitionSubstitutions['__new_fastq_list_row_payload_version__'] =
    NEW_FASTQ_LIST_ROW_PAYLOAD_VERSION;
  definitionSubstitutions['__fastq_list_row_event_shower_complete_status__'] =
    FASTQ_LIST_ROW_EVENT_SHOWER_COMPLETE_STATUS;
  definitionSubstitutions['__fastq_list_row_shower_complete_payload_version__'] =
    FASTQ_LIST_ROW_SHOWER_COMPLETE_PAYLOAD_VERSION;
  definitionSubstitutions['__stacky_fastq_list_row_shower_state_change__'] =
    STACKY_FASTQ_LIST_ROW_SHOWER_STATE_CHANGE;

  return definitionSubstitutions;
}

function wireUpStateMachinePermissions(scope: Construct, props: WirePermissionsProps): void {
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

  /* Check if the state machine needs the abilty to start / monitor distributed maps */
  if (sfnRequirements.needsDistributedMapPolicy) {
    // Because this steps execution uses a distributed map in its step function, we
    // have to wire up some extra permissions
    // Grant the state machine's role to execute itself
    // However we cannot just grant permission to the role as this will result in a circular dependency
    // between the state machine and the role
    // Instead we use the workaround here - https://github.com/aws/aws-cdk/issues/28820#issuecomment-1936010520
    const distributedMapPolicy = new iam.Policy(
      scope,
      `${props.stateMachineName}-distributed-map-policy`,
      {
        document: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: [props.stateMachineObj.stateMachineArn],
              actions: ['states:StartExecution'],
            }),
            new iam.PolicyStatement({
              resources: [
                `arn:aws:states:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:execution:${props.stateMachineObj.stateMachineName}/*:*`,
              ],
              actions: [
                'states:RedriveExecution',
                'states:AbortExecution',
                'states:DescribeExecution',
              ],
            }),
          ],
        }),
      }
    );
    // Add the policy to the state machine role
    props.stateMachineObj.role.attachInlinePolicy(distributedMapPolicy);

    // Add Nag suppressions
    NagSuppressions.addResourceSuppressions(
      [props.stateMachineObj, distributedMapPolicy],
      [
        {
          id: 'AwsSolutions-IAM5',
          reason:
            'This policy is required to allow the state machine to start executions of itself and monitor them. ' +
            'It is not possible to scope this down further without causing circular dependencies.',
        },
      ]
    );
  }
}

function buildStepFunction(scope: Construct, props: BuildSfnProps): SfnObject {
  const sfnNameToSnakeCase = camelCaseToSnakeCase(props.stateMachineName);

  /* Create the state machine definition substitutions */
  const stateMachine = new sfn.StateMachine(scope, props.stateMachineName, {
    stateMachineName: `${SFN_PREFIX}${props.stateMachineName}`,
    definitionBody: sfn.DefinitionBody.fromFile(
      path.join(STEP_FUNCTIONS_DIR, sfnNameToSnakeCase + '_sfn_template.asl.json')
    ),
    definitionSubstitutions: createStateMachineDefinitionSubstitutions(props),
  });

  /* Grant the state machine permissions */
  wireUpStateMachinePermissions(scope, {
    stateMachineObj: stateMachine,
    ...props,
  });

  return {
    stateMachineName: props.stateMachineName,
    stateMachineObj: stateMachine,
  };
}

export function buildAllStepFunctions(scope: Construct, props: BuildSfnsProps): SfnObject[] {
  // Initialise the step function objects
  const sfnObjects: SfnObject[] = [];

  // Iterate over the state machine names and create the step functions
  for (const sfnName of sfnNameList) {
    sfnObjects.push(
      buildStepFunction(scope, {
        stateMachineName: sfnName,
        ...props,
      })
    );
  }

  // Return the step function objects
  return sfnObjects;
}
