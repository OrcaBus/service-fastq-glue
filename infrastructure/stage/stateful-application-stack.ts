import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StatefulApplicationStackConfig } from './interfaces';
import { buildSchemas } from './event-schemas';

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
  }
}
