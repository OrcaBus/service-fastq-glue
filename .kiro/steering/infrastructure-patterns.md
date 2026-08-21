# Infrastructure Patterns

## Adding a New Lambda Function

When adding a new Lambda function, follow these steps in order:

1. **Add the lambda name** to the `LambdaNameList` union type in `infrastructure/stage/lambdas/interfaces.ts`
2. **Add the name to the array** `lambdaNameList` in the same file
3. **Define requirements** in `lambdaToRequirementsMap` specifying which capabilities the lambda needs:
   - `needsOrcabusApiToolsLayer`: Access to OrcaBus API tools layer
   - `needsAwsReadAccess`: Read access to the S3 primary data bucket
   - `needsMoreMemory`: 1024 MB memory (default is 128 MB)
   - `needsLongerTimeout`: 300s timeout (default is 60s)
4. **Create the lambda directory**: `app/lambdas/{snake_case_name}_py/`
5. **Create the handler file**: `app/lambdas/{snake_case_name}_py/{snake_case_name}.py`
6. **Optionally create** `requirements.txt` in the lambda directory for extra dependencies

### Lambda CDK Construction

Lambdas are built using `PythonUvFunction` from `@orcabus/platform-cdk-constructs/lambda`:

```typescript
const lambdaFunction = new PythonUvFunction(scope, props.lambdaName, {
  entry: path.join(LAMBDA_DIR, lambdaNameToSnakeCase + '_py'),
  runtime: lambda.Runtime.PYTHON_3_14,
  architecture: lambda.Architecture.ARM_64,
  index: lambdaNameToSnakeCase + '.py',
  handler: 'handler',
  timeout: Duration.seconds(60), // or 300 for longer
  includeOrcabusApiToolsLayer: true, // if needed
  memorySize: 1024, // if needed
});
```

## Adding a New Step Function

1. **Add the step function name** to the `SfnName` union type in `infrastructure/stage/step-functions/interfaces.ts`
2. **Add the name to** `sfnNameList` array
3. **Define requirements** in `SfnRequirementsMapType` specifying:
   - `requiredLambdaNameList`: Which lambdas this step function invokes
   - `needsPutEvents`: Whether it publishes to EventBridge
   - `needsDistributedMapPolicy`: Whether it uses distributed maps
4. **Create the ASL template**: `app/step-function-templates/{snake_case_name}_sfn_template.asl.json`

### ASL Template Conventions

- Use JSONata query language: `"QueryLanguage": "JSONata"`
- Use `{% ... %}` syntax for data transformations
- Lambda ARN placeholders: `${__snake_case_lambda_name_lambda_function_arn__}`
- Event bus placeholder: `${__event_bus_name__}`
- Event source placeholder: `${__stack_event_source__}`
- Detail type placeholders: `${__fastq_set_created_detail_type__}`, `${__read_sets_added_event_detail_type__}`, etc.
- Include retry policies on Lambda Invoke states
- Use `MaxConcurrency: 1` for distributed maps unless parallelism is safe

## Adding a New Event Rule

1. **Add the rule name** to the appropriate type in `infrastructure/stage/event-rules/interfaces.ts`
2. **Define the event pattern** matching the source and detail type
3. **Wire the target** in `infrastructure/stage/event-targets/`

## Stack Composition Pattern

The `StatelessApplicationStack` composes all resources in a specific order:

```typescript
// 1. Import shared resources (event bus, S3 bucket)
// 2. Build Lambdas
const lambdas = buildAllLambdaFunctions(this, { ... });
// 3. Build Step Functions (depends on lambdas)
const stepFunctions = buildAllStepFunctions(this, { lambdas, eventBus });
// 4. Build Event Rules
const eventRules = buildAllEventRules(this, { eventBus });
// 5. Wire Event Targets (connects rules to step functions)
buildAllEventBridgeTargets({ eventRules, stepFunctions });
```

## CDK-Nag Compliance

- All stacks must pass `AwsSolutionsChecks` from cdk-nag
- Add `NagSuppressions` with clear `reason` strings for any necessary exceptions
- Suppressions can be at stack level or resource level
- Common suppressions: `AwsSolutions-IAM4` (managed policies), `AwsSolutions-IAM5` (wildcard permissions), `AwsSolutions-SF1` (logging), `AwsSolutions-SF2` (X-Ray)

## Permission Wiring

Permissions are wired declaratively based on the requirements map:

- **Lambda invoke**: Step functions are granted `grantInvoke` on required lambdas via `currentVersion`
- **EventBridge**: Step functions with `needsPutEvents` get `grantPutEventsTo`
- **S3 read**: Lambdas with `needsAwsReadAccess` get `grantRead` scoped to the primary data prefix
- **SSM parameters**: Use `fromSecureStringParameterAttributes` + `grantRead` for secrets

## Platform Constructs

This project depends on `@orcabus/platform-cdk-constructs` for:

- `DeploymentStackPipeline`: CI/CD pipeline definition
- `PythonUvFunction`: Python Lambda with uv package manager support
- `StageName`: Environment type (`'BETA' | 'GAMMA' | 'PROD'`)
- `EVENT_SCHEMA_REGISTRY_NAME`: Shared EventBridge schema registry
- Shared config imports from `shared-config/accounts` and `shared-config/event-bridge`
