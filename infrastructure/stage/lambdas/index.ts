import {
  BuildLambdaProps,
  BuildLambdasProps,
  lambdaNameList,
  LambdaObject,
  lambdaToRequirementsMap,
} from './interfaces';
import { PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import path from 'path';
import {
  BASESPACE_ACCESS_TOKEN_SECRET_PATH,
  BASESPACE_API_SERVER_SSM_PARAMETER_PATH,
  GDRIVE_AUTH_JSON_SSM_PARAMETER_PATH,
  LAMBDA_DIR,
  METADATA_TRACKING_SHEET_ID_SSM_PARAMETER_PATH,
} from '../constants';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { camelCaseToSnakeCase } from '../utils';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export function buildLambdaFunction(scope: Construct, props: BuildLambdaProps): LambdaObject {
  const lambdaNameToSnakeCase = camelCaseToSnakeCase(props.lambdaName);
  const lambdaRequirementsMap = lambdaToRequirementsMap[props.lambdaName];

  /* Build the lambda function */
  const lambdaFunction = new PythonUvFunction(scope, props.lambdaName, {
    entry: path.join(LAMBDA_DIR, lambdaNameToSnakeCase + '_py'),
    runtime: lambda.Runtime.PYTHON_3_14,
    architecture: lambda.Architecture.ARM_64,
    index: lambdaNameToSnakeCase + '.py',
    handler: 'handler',
    timeout: lambdaRequirementsMap.needsLongerTimeout
      ? Duration.seconds(300)
      : Duration.seconds(60),
    includeOrcabusApiToolsLayer: lambdaRequirementsMap.needsOrcabusApiToolsLayer,
    memorySize: lambdaRequirementsMap.needsMoreMemory ? 1024 : undefined,
  });

  /* Do we need the bssh tools layer? */
  if (lambdaRequirementsMap.needsAwsReadAccess) {
    // Grant the lambda read access to the S3 bucket.
    // Grant to the function role (all versions, including $LATEST) rather than a specific
    // published version so permissions remain valid across lambda code updates.
    props.s3BucketPrefix.s3Bucket.grantRead(lambdaFunction, `${props.s3BucketPrefix.s3Prefix}*`);

    NagSuppressions.addResourceSuppressions(
      lambdaFunction,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'This lambda requires read access to the S3 bucket prefix.',
        },
      ],
      true
    );
  }

  if (props.lambdaName == 'createFastqSetObject') {
    const metadataTrackingSheetIdSsmParameterObj =
      ssm.StringParameter.fromSecureStringParameterAttributes(
        scope,
        'metadata_tracking_sheet_id_ssm_parameter',
        {
          parameterName: METADATA_TRACKING_SHEET_ID_SSM_PARAMETER_PATH,
        }
      );
    const gDriveAuthJsonSsmParameterObj = ssm.StringParameter.fromSecureStringParameterAttributes(
      scope,
      'gdrive_auth_json_ssm_parameter',
      {
        parameterName: GDRIVE_AUTH_JSON_SSM_PARAMETER_PATH,
      }
    );

    /* Add environment variables to the lambda function */
    lambdaFunction.addEnvironment(
      'METADATA_TRACKING_SHEET_ID_SSM_PARAMETER_PATH',
      metadataTrackingSheetIdSsmParameterObj.parameterName
    );
    lambdaFunction.addEnvironment(
      'GDRIVE_AUTH_JSON_SSM_PARAMETER_PATH',
      gDriveAuthJsonSsmParameterObj.parameterName
    );

    // Add permissions to the lambda function (all versions, including $LATEST)
    metadataTrackingSheetIdSsmParameterObj.grantRead(lambdaFunction);
    gDriveAuthJsonSsmParameterObj.grantRead(lambdaFunction);
  }

  if (lambdaRequirementsMap.needsBasespaceAccess) {
    const basespaceApiServerSsmParameterObj = ssm.StringParameter.fromStringParameterAttributes(
      scope,
      'basespace_api_server_ssm_parameter',
      {
        parameterName: BASESPACE_API_SERVER_SSM_PARAMETER_PATH,
      }
    );
    const basespaceAccessTokenSecretObj = secretsmanager.Secret.fromSecretNameV2(
      scope,
      'basespace_access_token_secret',
      BASESPACE_ACCESS_TOKEN_SECRET_PATH
    );

    /* Add environment variables to the lambda function */
    lambdaFunction.addEnvironment(
      'BASESPACE_API_SERVER_SSM_PARAMETER_PATH',
      basespaceApiServerSsmParameterObj.parameterName
    );
    lambdaFunction.addEnvironment(
      'BASESPACE_ACCESS_TOKEN_SECRETS_MANAGER_PATH',
      basespaceAccessTokenSecretObj.secretName
    );

    // Add permissions to the lambda function (all versions, including $LATEST)
    basespaceApiServerSsmParameterObj.grantRead(lambdaFunction);
    basespaceAccessTokenSecretObj.grantRead(lambdaFunction);

    NagSuppressions.addResourceSuppressions(
      lambdaFunction,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'This lambda requires read access to the BaseSpace SSM parameter and secret.',
        },
      ],
      true
    );
  }

  /* Return the lambda object */
  return {
    lambdaName: props.lambdaName,
    lambdaFunction: lambdaFunction,
  };
}

export function buildAllLambdaFunctions(
  scope: Construct,
  props: BuildLambdasProps
): LambdaObject[] {
  // Iterate over lambdaNameList and create the lambda functions
  const lambdaObjects: LambdaObject[] = [];
  for (const lambdaName of lambdaNameList) {
    lambdaObjects.push(
      buildLambdaFunction(scope, {
        lambdaName: lambdaName,
        ...props,
      })
    );
  }

  // Return the lambda objects
  return lambdaObjects;
}
