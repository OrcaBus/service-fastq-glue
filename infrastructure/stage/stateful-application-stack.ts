import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StatefulApplicationStackConfig } from './interfaces';
import { buildSchemas } from './event-schemas';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import {
  BASESPACE_ACCESS_TOKEN_SECRET_PATH,
  BASESPACE_API_SERVER_SSM_PARAMETER_PATH,
} from './constants';

export type StatefulApplicationStackProps = cdk.StackProps & StatefulApplicationStackConfig;

export class StatefulApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StatefulApplicationStackProps) {
    super(scope, id, props);

    /**
     * Define your stack to be deployed in stages here
     *
     * Build the ssm parameters stack
     */
    // Add to the schema registry
    buildSchemas(this);

    // BaseSpace API server SSM parameter
    new ssm.StringParameter(this, 'basespaceApiServerSsmParameter', {
      parameterName: BASESPACE_API_SERVER_SSM_PARAMETER_PATH,
      stringValue: 'api.basespace.illumina.com',
      description: 'BaseSpace Sequence Hub API server hostname',
    });

    // BaseSpace access token secret
    new secretsmanager.Secret(this, 'basespaceAccessTokenSecret', {
      secretName: BASESPACE_ACCESS_TOKEN_SECRET_PATH,
      description: 'BaseSpace Sequence Hub access token for deleting run data',
    });
  }
}
