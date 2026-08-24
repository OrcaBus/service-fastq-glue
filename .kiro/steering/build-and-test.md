# Build, Test, and CI/CD

## Package Manager

This project uses **pnpm 11.2.2**. Always use `pnpm` commands, never `npm` or `yarn`.

## Common Commands

### Install dependencies

```bash
pnpm install --frozen-lockfile
```

### Run all checks (audit + prettier + lint + pre-commit)

```bash
make check
```

### Auto-fix formatting and lint issues

```bash
make fix
```

### Run tests (type-check then jest)

```bash
pnpm test
```

This runs `tsc && jest` — TypeScript compilation check followed by Jest tests.

### CDK Synth

```bash
pnpm cdk-stateless synth    # Synthesize stateless stack
pnpm cdk-stateful synth     # Synthesize stateful stack
```

### Prettier

```bash
pnpm prettier        # Check formatting
pnpm prettier-fix    # Fix formatting
```

### ESLint

```bash
pnpm lint            # Check lint rules
pnpm lint-fix        # Auto-fix lint issues
```

## Testing Approach

- **Framework**: Jest with ts-jest
- **Test location**: `test/` directory at project root
- **Test pattern**: `test/*.test.ts`
- **Test type**: CDK-nag compliance tests that synthesize stacks and verify no AwsSolutions errors or warnings
- **Test configuration**: Uses PROD stage config as it is the most strict environment

### Writing Tests

Tests synthesize the CDK stack and use `cdk-nag` to verify compliance:

```typescript
import { App, Aspects } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';
import { getStatelessStackProps } from '../infrastructure/stage/config';
import { StatelessApplicationStack } from '../infrastructure/stage/stateless-application-stack';

describe('cdk-nag-stateless-stage-stack', () => {
  const app = new App({});
  const deployStack = new StatelessApplicationStack(app, 'StatelessApplicationStack', {
    ...getStatelessStackProps('PROD'),
  });
  Aspects.of(deployStack).add(new AwsSolutionsChecks());

  test('cdk-nag AwsSolutions Pack errors', () => {
    const errors = Annotations.fromStack(deployStack)
      .findError('*', Match.stringLikeRegexp('AwsSolutions-.*'))
      .map(synthesisMessageToString);
    expect(errors).toHaveLength(0);
  });
});
```

## Pre-commit Hooks

The project uses pre-commit with the following hooks:

- `check-added-large-files` (excludes pnpm-lock.yaml)
- `check-yaml`
- `detect-aws-credentials`
- `detect-private-key`
- `detect-secrets` (with baseline file `.secrets.baseline`)
- `end-of-file-fixer`
- `trailing-whitespace`
- `no-commit-to-branch` (blocks direct commits to main, master, release/*)
- `eslint`
- `prettier`

Install hooks with:

```bash
pnpm prepare
```

## CI/CD Pipeline

- **Source**: GitHub repository
- **Pipeline construct**: `DeploymentStackPipeline` from `@orcabus/platform-cdk-constructs`
- **Deployment stages**: BETA -> GAMMA -> PROD
- **Separate pipelines** for stateless and stateful resources
- **GitHub workflows**: `.github/workflows/pr-tests.yml` (PR checks) and `.github/workflows/pnpm-audit.yml` (dependency audit)

## CDK Context

The `cdk.json` file configures:

- App command: `pnpx ts-node bin/deploy.ts`
- Feature flags for CDK best practices
- Deploy mode selection via `-c deployMode=stateless|stateful`
