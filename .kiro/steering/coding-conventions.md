# Coding Conventions

## TypeScript (Infrastructure)

### General Rules

- Target: ES2022, CommonJS modules
- Strict mode enabled (`strict: true`, `noImplicitAny`, `strictNullChecks`, `noImplicitReturns`)
- Use single quotes for strings
- Trailing commas: es5 style
- Print width: 100 characters
- 2-space indentation, no tabs
- Semicolons required
- Arrow parens always included: `(x) => x`

### Naming Conventions

- **TypeScript variables/functions**: camelCase (e.g., `buildAllLambdaFunctions`, `eventBusName`)
- **TypeScript types/interfaces**: PascalCase (e.g., `StatelessApplicationStackConfig`, `LambdaNameList`)
- **CDK construct IDs**: camelCase (e.g., `'eventBus'`, `'s3Bucket'`)
- **AWS resource names**: kebab-case with stack prefix (e.g., `fastq-glue--stateMachineName`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `STACK_PREFIX`, `EVENT_BUS_NAME`)
- **File names**: kebab-case for TypeScript files (e.g., `stateless-application-stack.ts`)

### Import Style

- Use named imports from `aws-cdk-lib` sub-modules: `import * as s3 from 'aws-cdk-lib/aws-s3'`
- Use direct imports for constructs: `import { Construct } from 'constructs'`
- Platform constructs: `import { PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda'`
- Group imports: CDK imports first, then platform constructs, then local imports

### Code Organization

- Each infrastructure subdirectory has `index.ts` (builder functions) and `interfaces.ts` (types/maps)
- Export builder functions that accept a `Construct` scope and typed props
- Use union types for enumerating resource names (e.g., `type LambdaNameList = 'name1' | 'name2'`)
- Use requirement maps (`Record`-style objects) to declare resource configuration declaratively

## Python (Lambda Functions)

### General Rules

- Python 3.14 runtime
- Each lambda lives in its own directory: `app/lambdas/{snake_case_name}_py/`
- Handler file name matches directory base: `{snake_case_name}.py`
- Entry point is always `def handler(event, context):`
- Include a shebang line: `#!/usr/bin/env python3`
- Include a module-level docstring explaining inputs and outputs

### Naming Conventions

- **Lambda directory names**: snake_case with `_py` suffix (e.g., `create_fastq_set_object_py`)
- **Python files**: snake_case (e.g., `create_fastq_set_object.py`)
- **Functions**: snake_case (e.g., `get_date_from_instrument_run_id`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PLATFORM`, `DEFAULT_CENTER`)
- **Classes**: PascalCase

### Import Patterns

- Standard library imports first
- Third-party imports second (boto3, pandas, etc.)
- Layer imports last (`from orcabus_api_tools.fastq import ...`)
- Use `typing.TYPE_CHECKING` for type-only imports (e.g., mypy_boto3 stubs)

### Dependencies

- Common dependencies come from the `orcabus_api_tools` Lambda layer (specified via `includeOrcabusApiToolsLayer` in the CDK)
- Additional dependencies go in a `requirements.txt` file in the lambda directory
- Use `boto3` for AWS SDK calls
- Use `pandas` for data manipulation when needed

### Handler Pattern

```python
#!/usr/bin/env python3

"""
Brief description of what this lambda does.
"""

# Standard imports
from typing import List

# Layer imports
from orcabus_api_tools.fastq import some_function


def handler(event, context):
    """
    Description of the handler.
    :param event: Input event structure
    :param context: Lambda context
    :return: Output structure
    """
    # Get inputs from event
    input_value = event["inputKey"]

    # Business logic
    result = some_function(input_value)

    # Return structured output
    return {"outputKey": result}
```

## Naming Conversion Rules

The project uses automatic conversion between TypeScript camelCase names and Python/AWS snake_case names:

- Lambda name `createFastqSetObject` -> directory `create_fastq_set_object_py/` -> file `create_fastq_set_object.py`
- Step function name `fastqSetGeneration` -> template file `fastq_set_generation_sfn_template.asl.json`
- Step function substitution keys use double underscore prefix/suffix: `__snake_case_name_lambda_function_arn__`
