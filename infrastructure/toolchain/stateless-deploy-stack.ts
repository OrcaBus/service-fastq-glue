import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentStackPipeline } from '@orcabus/platform-cdk-constructs/deployment-stack-pipeline';
import { getStatelessStackProps } from '../stage/config';
import { REPO_NAME } from './constants';
import { ApplicationStatelessStack } from '../stage/application-stack';

export class StatelessDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DeploymentStackPipeline(this, 'StatelessFastqGluePipeline', {
      githubBranch: 'main',
      githubRepo: REPO_NAME,
      stack: ApplicationStatelessStack,
      stackName: 'FastqGlueStack',
      stackConfig: {
        beta: getStatelessStackProps('BETA'),
        gamma: getStatelessStackProps('GAMMA'),
        prod: getStatelessStackProps('PROD'),
      },
      pipelineName: 'OrcaBus-StatelessFastqGlue',
      cdkSynthCmd: ['pnpm install --frozen-lockfile --ignore-scripts', 'pnpm cdk-stateless synth'],
    });
  }
}
