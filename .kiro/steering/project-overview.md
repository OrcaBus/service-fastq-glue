# Project Overview: service-fastq-glue

## Purpose

This is an AWS CDK (TypeScript) project that deploys an event-driven "glue" service for managing FASTQ file metadata in the OrcaBus platform. It reacts to sequencing run events from EventBridge and orchestrates FASTQ set creation, read set addition, fingerprint extraction, and failure cleanup via Step Functions and Python Lambda functions.

## Architecture

- **Infrastructure language**: TypeScript (CDK)
- **Runtime language**: Python 3.14 (Lambda functions on ARM_64)
- **Package manager**: pnpm 11.2.2
- **CDK version**: aws-cdk-lib ^2.263.0
- **Platform constructs**: @orcabus/platform-cdk-constructs (shared OrcaBus constructs)

## Directory Structure

```
bin/deploy.ts                         # CDK app entry point
infrastructure/
  toolchain/                          # CI/CD pipeline stacks (stateless + stateful deploy)
    constants.ts                      # Repo name, pipeline config
    stateless-deploy-stack.ts
    stateful-deploy-stack.ts
  stage/                              # Application stacks
    stateless-application-stack.ts    # Main stack composing all resources
    stateful-application-stack.ts     # Stateful resources (if any)
    config.ts                         # Per-stage configuration factory
    constants.ts                      # All constants (event types, SSM paths, S3 config)
    interfaces.ts                     # Stack-level interfaces
    lambdas/                          # Lambda CDK construct builders
      index.ts                        # buildAllLambdaFunctions
      interfaces.ts                   # Lambda names, requirements map
    step-functions/                   # Step Function CDK construct builders
      index.ts                        # buildAllStepFunctions
      interfaces.ts                   # SFN names, requirements map
    event-rules/                      # EventBridge rule builders
    event-targets/                    # EventBridge target wiring
    event-schemas/                    # Schema registration
    utils/                            # Utility functions (camelCase converters)
app/
  lambdas/                            # Python lambda source code
    {snake_case_name}_py/             # Each lambda in its own directory
      {snake_case_name}.py            # Handler file
      requirements.txt                # Optional extra dependencies
  step-function-templates/            # ASL JSON definitions
    {snake_case_name}_sfn_template.asl.json
  event-schemas/                      # EventBridge schema JSON files
test/                                 # Jest tests (cdk-nag compliance)
docs/                                 # Documentation and diagrams
```

## Event-Driven Design

- **Event bus**: `OrcaBusMain`
- **Event source**: `orcabus.fastqglue`
- **Listens to**: `orcabus.sequencerunmanager`, `orcabus.workflowmanager`
- **Emits**: `FastqListRowsAdded`, `ReadSetsAdded`, `SrmFailureCleanupFastqCompleted`

## Multi-Environment Deployment

Three stages deployed via pipeline: BETA, GAMMA, PROD. Stage-specific values (S3 bucket names, prefixes) are configured in `infrastructure/stage/constants.ts` using `Record<StageName, string>` maps.

## Deploy Modes

The CDK app uses `-c deployMode=stateless|stateful` context variable:

- `pnpm cdk-stateless` for stateless resources (lambdas, step functions, event rules)
- `pnpm cdk-stateful` for stateful resources (persistent storage, if any)
