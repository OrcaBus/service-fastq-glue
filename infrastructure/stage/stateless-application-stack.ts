// Standard cdk imports
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { StatelessApplicationStackConfig } from './interfaces';
import * as events from 'aws-cdk-lib/aws-events';
import { buildAllLambdaFunctions } from './lambdas';
import { buildAllEventBridgeTargets } from './event-targets';
import { buildAllStepFunctions } from './step-functions';
import { buildAllEventRules } from './event-rules';
import { NagSuppressions } from 'cdk-nag';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

export type StatelessApplicationStackProps = cdk.StackProps & StatelessApplicationStackConfig;

export class StatelessApplicationStack extends cdk.Stack {
  public readonly stageName: StageName;
  constructor(scope: Construct, id: string, props: StatelessApplicationStackProps) {
    super(scope, id, props);
    this.stageName = props.stageName;

    // Event Bus
    const eventBus = events.EventBus.fromEventBusName(this, 'eventBus', props.eventBusName);

    // Get S3 Bucket
    const s3Bucket = s3.Bucket.fromBucketName(this, 's3Bucket', props.awsS3CacheBucketName);

    // Build Lambdas
    const lambdas = buildAllLambdaFunctions(this, {
      s3BucketPrefix: {
        s3Bucket: s3Bucket,
        s3Prefix: props.awsS3PrimaryDataPrefix,
      },
    });

    // Build Step Functions
    const stepFunctionObjects = buildAllStepFunctions(this, {
      lambdas: lambdas,
      eventBus: eventBus,
    });

    // Build Event Rules
    const eventBridgeRuleObjects = buildAllEventRules(this, {
      /* Event Bus */
      eventBus: eventBus,
    });

    // // Build Event Targets
    buildAllEventBridgeTargets({
      eventBridgeRuleObjects: eventBridgeRuleObjects,
      stepFunctionObjects: stepFunctionObjects,
    });

    // Add in stack-level suppressions
    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM4',
        reason: 'We need to add this for the lambdas to work',
      },
      {
        id: 'AwsSolutions-SF1',
        reason: "We don't need to log all step function events to cloudwatch",
      },
      {
        id: 'AwsSolutions-SF2',
        reason: "We don't need X-Ray tracing for this stack",
      },
    ]);
  }
}
