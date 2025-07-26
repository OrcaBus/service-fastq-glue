# Fastq Glue

## Overview

Create fastq set objects once the Sequence Run Manager completes,
Then add in the read set objects once the bssh Fastq Copy service has completed.

This is a 'stateless-only' service, meaning no stateful resources are required.

This service interacts a lot with the [fastq-manager service](https://github.com/orcabus/fastq-manager-service).
There may be some assumed knowledge of how the fastq-manager service works in this documentation,
so please refer to the fastq-manager documentation for more information.

## Event Bus / Events Targets Overview

There are two different event types that trigger this service.

The application listens to SequenceRunManagerStateChange events where the status is 'SUCCEEDED'.
This ensures that the SampleSheet is available and the run is complete before we start creating the fastq set objects.

The fastq objects are created without readsets, meaning that they do not contain links to files, since these files do not exist yet.

The application also listens to bssh Fastq Copy events where the status is 'SUCCEEDED'.
On these events, the application will add the readset objects to the fastq set objects that were created in the previous step.

For a given instrument run id, these events usually happens a few hours apart since BCLConvert is started once the Sequence Run Completes,
and takes a few hours to run. After the BCLConvert is completed, the BSSH Fastq Copy service then takes around 20 minutes to complete.

We could just listen to the bssh Fastq Copy events, but this would mean that we would have to
wait for the BCLConvert to complete before we can start creating the fastq set objects.

By generating the fastq set objects earlier, we can kick off analysis drafts earlier and pull any additionally required fastqs out of archive simultaneously.

![fastq-glue-events](docs/drawio-exports/fastq-glue-events.drawio.svg)

### External Event Triggers

#### SequenceRunManager Succeeded

<detail>

<summary>Click to expand</summary>

```json5
{
  "version": "0",
  "id": "uuid",
  // SRM Detail Type
  "detail-type": "SequenceRunStateChange",
  // SRM Source
  "source": "orcabus.sequencerunmanager",
  // Prod account
  "account": "472057503814",
  "time": "2025-05-10T23:58:01Z",
  "region": "ap-southeast-2",
  "resources": [],
  "detail": {
    // Microservice generated id
    "id": "seq.01JTSVXE0AXSFKNTDGFEHBAPAS",
    // Instrument Run Id
    "instrumentRunId": "250509_A01052_0262_BHFGJWDSXF",
    // Instrument Run Start and End Time (once uploaded)
    "startTime": "2025-05-09T06:32:13.267418+00:00",
    "endTime": "2025-05-10T23:57:35.246987+00:00",
    // Status
    "status": "SUCCEEDED",
    // Sequence Directory on GDS (we dont have access to this)
    "runDataUri": "gds://bssh.24734fa0debe3f9f8b9221244f46822c",
    "runFolderPath": "",
    // Or this
    "runVolumeName": "bssh.24734fa0debe3f9f8b9221244f46822c",
    // Samplesheet used on Instrument, also available at SampleSheet.csv
    "sampleSheetName": "sampleSheet_v2.csv",
  }
}
```

</detail>

#### BSSH Fastq To AWS Copy Succeeded

<detail>

<summary>Click to expand</summary>

```json5
{
  // Name of the event bus
  "EventBusName": "OrcaBusMain",
  // Workflow Manager event type
  "DetailType": "WorkflowRunStateChange",
  // Event relayed by the workflow manager
  "Source": "orcabus.workflowmanager",
  "Detail": {
    // Workflow run status
    "status": "SUCCEEDED",
    // Timestamp of the event
    "timestamp": "2025-04-22T00:09:07.220Z",
    // Portal Run ID For the BSSH Fastq Copy Manager
    "portalRunId": "202504179cac7411",  // pragma: allowlist secret
    // Workflow name
    "workflowName": "bssh-fastq-to-aws-copy",
    // Workflow version
    "workflowVersion": "2025.05.14",
    // Workflow run name
    "workflowRunName": "umccr--automated--bssh-fastq-to-aws-copy--2024-05-24--202504179cac7411",
    // Linked libraries in the instrument run
    "linkedLibraries": [
      {
        "orcabusId": "lib.12345",
        "libraryId": "L20202020"
      }
    ],
    "payload": {
      "refId": "workflowmanagerrefid",
      "version": "2024.07.01",
      "data": {
        // Original inputs from READY State
        "inputs": {
          "bsshAnalysisId": "33aca803-6bd4-48ec-8443-150e52852053",
          "bsshProjectId": "a7c67a80-c8f2-4348-adec-3a5a073d1d55",
          "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3"
        },
        // Original outputs from READY state
        "engineParameters": {
          "outputUri": "s3://pipeline-dev-cache-503977275616-ap-southeast-2/byob-icav2/development/primary/20231010_pi1-07_0329_A222N7LTD3/202504179cac7411/"
        },
        // Added by the bssh fastq copy manager
        // And needed by downstream 'glues'
        // Hoping to delete the fastqListRowsB64gz attribute from the event
        // As soon as the clag glues can instead listen to the fastq glues
        "outputs": {
          "outputUri": "s3://pipeline-dev-cache-503977275616-ap-southeast-2/byob-icav2/development/primary/20231010_pi1-07_0329_A222N7LTD3/202504179cac7411/",
          "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3",
          "fastqListRowsB64gz": "H4sIAJPdBmgC/92U0WvCMBDG/xXps2lyFzXWt1gxDDoZNnsaI0TNZqFqZp3gxv73pSCMjWL33Kd83H1H7oMf9/QZLdXdLJr0ojRVqVJax6mWQaU6hqjfC+38vm7r/GFOFhJwLMYE2JQsnb8asulNQ2b3Lhig9jq7gXlRusdjUc9UfEKpL7wri70jG3cma7veOjJkPBECxXAEI2I9qQ7vp62z1YkgXV0OK1Ks7RlpGHDlwe/c/kT9sdjZ44UiQw4MmPEFECYM45gYiYgLkekZr/tDNgCRhJ/EAIDmdudLV9F6TQO0MUZz1eRgMsbALMGEJ34JC77Frx/RNSl2MCn+TvrV7/0QJAM9qVQq1qkOMohWgrCNIOwGQdhcNTl2jaDWpLcI0lJqGRCKlVa1/McN4m0E8W4QxJurJuddI6g16V+Cnr8Bp+MZ4cYGAAA="  // pragma: allowlist secret
        },
        // Original tags from READY State
        "tags": {
         "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3"
        }
      }
    }
  }
}
```

</detail>

## Step Functions Overview

### Fastq Set Creation SFN

Create the fastq list row and fastq set objects using the libraries in the samplesheet.

The fastq manager only allows one 'current' fastq set object per library.

![fastq-set-creation-sfn](docs/workflow-studio-exports/create-fastq-sets.svg)

#### Topup and Rerun Library Edge Cases

Because we do not receive 'topup' or 'rerun' level information from the SampleSheet, we must also
query the lab-metadata GSheet to determine if this is a topup or rerun for duplicate libraries.

For 'topup' cases, the existing fastq set remains and a new fastq list row object is appended to the existing fastq set.

For 'rerun' cases, the existing fastq set is marked as 'archived' and a new fastq set object is created.

#### Event Generation

The Fastq Set Creation SFN generates the following events:

**Fastq List Row Added Event**

> This is collected by the analysis glue manager to trigger all possible analyses that can be
> generated from this instrument run

While one could subscribe to the individual FastqStateChange and FastqSetStateChange events,
as these are generated by the fastq manager, we have instead created a custom event type that happens AFTER
all the fastq list rows have been created.

This means by subscribing to this event, one can assume that all the fastq list rows have been created
for this instrument run id.


```json5
{
  "EventBusName": "OrcaBusMain",
  "DetailType": "FastqListRowsAdded",
  "Source": "orcabus.fastqglue",
  "Detail": {
    "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3"
  }
}
```

The following events are then also generated accordingly by the fastq manager.

- FastqStateChange  (once for creating the fastq list row)
- FastqSetStateChange  (once for creating the fastq set)

Please refer to the fastq manager manual for these event type structures.

### Add Read Set SFN

After the bssh Fastq Copy service has completed, the application will add the readset objects to the fastq set objects that were created in the previous step.

We use the `fastq_list.csv` file in the `Reports/` directory to determine the file paths for the readsets.

We also query the `Demultiplex_Stats.csv` file in the `Reports/` directory to determine the number of reads for each fastq pair.

By using the cycle count from the samplesheet, in combination with the number of reads from the `Demultiplex_Stats.csv` file,
we can also determine the estimated base count for each fastq pair.

![add-read-set-sfn](docs/workflow-studio-exports/add-read-set.svg)

#### Event Generation

While the Fastq Set Generation SFN generates a custom event at the end of the workflow,
the Add Read Set SFN does not generate any events itself, this is by design.

The intention is that all workflow drafts have already been created by the analysis glue triggered by the FastqSetAdded event.

Workflow drafts can use the fastq list row state change events to determine if they need to update the fastq set objects.

The fastq manager however will generate the following events.

- FastqStateChange  (once for adding in the read set)
- FastqStateChange  (and then again immediately after for adding in the read / basecount scores)

Please refer to the fastq manager manual for these event type structures.

## Project Structure

The project is organized into the following key directories:

- **`./app`**: Contains the main application logic. You can open the code editor directly in this folder, and the application should run independently.

- **`./bin/deploy.ts`**: Serves as the entry point of the application. It initializes two root stacks: `stateless` and `stateful`. You can remove one of these if your service does not require it.

- **`./infrastructure`**: Contains the infrastructure code for the project:
  - **`./infrastructure/toolchain`**: Includes stacks for the stateless and stateful resources deployed in the toolchain account. These stacks primarily set up the CodePipeline for cross-environment deployments.
  - **`./infrastructure/stage`**: Defines the stage stacks for different environments:
    - **`./infrastructure/stage/config.ts`**: Contains environment-specific configuration files (e.g., `beta`, `gamma`, `prod`).
    - **`./infrastructure/stage/stack.ts`**: The CDK stack entry point for provisioning resources required by the application in `./app`.

- **`.github/workflows/pr-tests.yml`**: Configures GitHub Actions to run tests for `make check` (linting and code style), tests defined in `./test`, and `make test` for the `./app` directory. Modify this file as needed to ensure the tests are properly configured for your environment.

- **`./test`**: Contains tests for CDK code compliance against `cdk-nag`. You should modify these test files to match the resources defined in the `./infrastructure` folder.

## Setup

### Requirements

```sh
node --version
v22.9.0

# Update Corepack (if necessary, as per pnpm documentation)
npm install --global corepack@latest

# Enable Corepack to use pnpm
corepack enable pnpm

```

### Install Dependencies

To install all required dependencies, run:

```sh
make install
```

### CDK Commands

You can access CDK commands using the `pnpm` wrapper script.

This template provides two types of CDK entry points: `cdk-stateless` and `cdk-stateful`.

- **`cdk-stateless`**: Used to deploy stacks containing stateless resources (e.g., AWS Lambda), which can be easily redeployed without side effects.
- **`cdk-stateful`**: Used to deploy stacks containing stateful resources (e.g., AWS DynamoDB, AWS RDS), where redeployment may not be ideal due to potential side effects.

The type of stack to deploy is determined by the context set in the `./bin/deploy.ts` file. This ensures the correct stack is executed based on the provided context.

For example:

```sh
# Deploy a stateless stack
pnpm cdk-stateless <command>
```

### Stacks

This CDK project manages multiple stacks. The root stack (the only one that does not include `DeploymentPipeline` in its stack ID) is deployed in the toolchain account and sets up a CodePipeline for cross-environment deployments to `beta`, `gamma`, and `prod`.

To list all available stacks, run:

```sh
pnpm cdk-stateless ls
```

Example output:

```sh
OrcaBusStatelessServiceStack
OrcaBusStatelessServiceStack/DeploymentPipeline/OrcaBusBeta/DeployStack (OrcaBusBeta-DeployStack)
OrcaBusStatelessServiceStack/DeploymentPipeline/OrcaBusGamma/DeployStack (OrcaBusGamma-DeployStack)
OrcaBusStatelessServiceStack/DeploymentPipeline/OrcaBusProd/DeployStack (OrcaBusProd-DeployStack)
```

## Linting and Formatting

### Run Checks

To run linting and formatting checks on the root project, use:

```sh
make check
```

### Fix Issues

To automatically fix issues with ESLint and Prettier, run:

```sh
make fix
```
