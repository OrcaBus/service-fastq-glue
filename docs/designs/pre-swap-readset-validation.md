# Pre-Swap Read Set Validation

## Problem

The `fastqSetAddReadSet` step function runs after the BSSH-to-AWS FASTQ copy
succeeds. It swaps the placeholder read set URIs on each pre-registered `Fastq`
object for the real S3 URIs produced by the demultiplex, and records the read
count / base count estimate coming out of the demux stats file.

Today the only integrity guard is the one added in
[PR #55](https://github.com/OrcaBus/service-fastq-glue/pull/55): before
detaching an existing read set, `add_read_sets_to_fastq_objects` compares the
`readCount` / `baseCountEst` from the **demux stats** against the values already
recorded on the `Fastq` object and raises on a mismatch.

That guard trusts the demux stats file. It does not actually look at the bytes
of the newly copied files. We want a stronger guarantee: before we swap the
URIs, confirm that the **new** files genuinely reproduce the read count and the
raw md5sum that the fastq manager already recorded for that fastq id.

## Goal

Add a validation phase that runs **before** the URI swap (and therefore before
the `ReadSetsAdded` event that lets BCLConvert move on). For every fastq id that
already has a recorded read set, it:

1. Calculates the **read count** of the new file(s) via the fastq-decompression
   manager, pointed at the new URIs, and compares it to the fastq object's
   recorded `readCount`.
2. Calculates the **raw md5sum** of the new file(s) via the fastq-decompression
   manager, pointed at the new URIs, and compares it to the fastq object's
   recorded `readSet.r1/r2.rawMd5sum`.

If the fastq object does not yet have a recorded read count / file compression
information (raw md5sum), we ask the **fastq-sync manager** to compute those
values on the **old** version of the fastq (via `hasReadCount` /
`hasFileCompressionInformation` requirements). Those requests run in parallel
with the new-file calculations and return immediately if the data already
exists, so there is no need to pre-check.

If any read counts or md5sums do not match, we do **not** fail fast. We collect
all discrepancies across every fastq in the run, and only after everything has
been calculated do we fail the step function, surfacing the full list of
mismatches. On failure we never reach the URI swap or the `ReadSetsAdded` event,
so BCLConvert is not moved over.

## External contracts (verified from the manager repos)

### Fastq-decompression manager (`service-fastq-decompression-manager`)

Consumed sync events on `OrcaBusMain` (task-token callback pattern):

| Purpose    | DetailType                             |
| ---------- | -------------------------------------- |
| Read count | `ReadCountCalculationRequestSync`      |
| Raw md5sum | `OraToRawMd5sumCalculationRequestSync` |

Detail shape:

```json5
{
  taskToken: '<sfn task token>',
  payload: {
    fastqIdList: ['fqr.123'],
    fileUriByFastqIdMap: {
      'fqr.123': ['s3://.../..._R1_001.fastq.ora', 's3://.../..._R2_001.fastq.ora'],
    },
  },
}
```

Notes:

- `fileUriByFastqIdMap` maps a fastq id to a list of ORA file URIs. The manager
  selects R1/R2 by filename suffix `_R1_001.fastq.ora` / `_R2_001.fastq.ora`, so
  the URIs we pass must be the ORA source files for the new copy.
- Read count sync output: `{ "readCountList": [ { "fastqId", "readCount" } ] }`.
- Raw md5sum sync output:
  `{ "rawMd5sumList": [ { "fastqId", "rawMd5sumByOraFileIngestIdList": [ { "ingestId", "rawMd5sum" } ] } ] }`.
  The `ingestId`s correspond to the fastq object's existing readSet ingest ids
  (`readSet.r1.ingestId` / `readSet.r2.ingestId`).

### Fastq-sync manager (`service-fastq-sync-manager`)

Consumed event on `OrcaBusMain`, `DetailType: FastqSync` (task-token callback):

```json5
{
  taskToken: '<sfn task token>',
  payload: {
    fastqIdList: ['fqr.123'],
    requirements: {
      hasReadCount: true,
      hasFileCompressionInformation: true,
    },
  },
}
```

Returns immediately (success callback) if the requirements are already met,
otherwise launches the underlying jobs and calls back when done. This is how we
guarantee the **old** fastq has a recorded read count and md5sum to compare
against.

## Data flow

The step function runs as **two sequential top-level phases**. Validation for
the **entire run** must complete and pass before **any** read set is swapped -
no read set is reassigned unless every existing fastq id in the run is confirmed
unchanged.

```
Get Libraries in Instrument Run ID                [existing]
        |
        v
PHASE 1 - Validate all fastqs in run (batched)    [new, top-level DISTRIBUTED map]
  Per batch of libraries:
    Get read sets for validation (parallel: fastq objects + file names)
      -> dataByLibrary = [{ libraryId, fastqIdList, fileNamesList }]
    Build validation list (lambda)
      -> validationList = [{ fastqId, newRead1FileUri, newRead2FileUri? }]
    Validate fastqs in batch (inline map, MaxConcurrency 10):
      Per fastq:
        Parallel:
          Branch 0 (old-fastq readiness, fastq-sync):
            FastqSync (waitForTaskToken) {hasReadCount, hasFileCompressionInformation}
          Branch 1 (new-file read count, decompression):
            ReadCountCalculationRequestSync (waitForTaskToken) + fileUriByFastqIdMap
          Branch 2 (new-file md5, decompression):
            OraToRawMd5sumCalculationRequestSync (waitForTaskToken) + fileUriByFastqIdMap
        Compare read count + raw md5sum (lambda)
          -> { fastqId, matches: bool, discrepancies: [...] }
    Batch output -> { results: [...] }
  Map aggregates all batch results into validationResults
        |
        v
Any discrepancies?  (top-level Choice)            [new]
  If any result has matches == false -> Fail on discrepancies (NO swap happens)
  Else -> Phase 2
        |
        v
PHASE 2 - For each library (batched)              [existing, top-level DISTRIBUTED map]
  Per batch: Get read sets (parallel) -> For each library -> Add Read Sets (URI swap)
        |
        v
ReadSets Added Event                              [existing]
```

Both phases iterate the run in batches (`MaxItemsPerBatch: 10`,
`MaxConcurrency: 1`) as top-level distributed maps, which scales to 200+
samples. Phase 1 fetches fastq objects and file names only (it does not need the
demux stats); Phase 2 additionally fetches the demux stats it needs to write the
read counts during the swap.

Because Phase 1 is a distinct top-level map that fully completes before the
`Any discrepancies?` choice, a discrepancy in the very last batch still blocks
the swap of the very first fastq - the run is all-or-nothing.

## New lambdas

1. `generateFastqValidationList`
   - Input: `dataByLibrary` (the joined per-library object already built by the
     `Get read sets` parallel state).
   - Output: a flat list `[{ fastqId, newRead1FileUri, newRead2FileUri? }]`,
     matching each fastq id to its new file URIs by lane (same lane-matching
     logic `add_read_sets_to_fastq_objects` uses).
   - No AWS/layer access needed beyond the orcabus api tools layer for fetching
     fastq objects to resolve lane -> fastq id (or we reuse the fastqIdList +
     fileNamesList already present and match by lane via `get_fastq`).

2. `compareFastqReadCountAndMd5`
   - Input: the fastq id, the read-count calculation output, the raw-md5sum
     calculation output.
   - Fetches the fastq object (`get_fastq(..., includeS3Details=True)`),
     compares:
     - `readCount` (new) vs `fastq.readCount` (recorded)
     - each `rawMd5sumByOraFileIngestIdList[*].rawMd5sum` (new) vs the recorded
       `readSet.r1/r2.rawMd5sum`, matched by `ingestId`.
   - Output: `{ fastqId, matches: bool, discrepancies: [ { type, expected, actual, read? } ] }`.
     Never raises on a mismatch — mismatches are data, collected downstream.

## Failure semantics

- Individual mismatches are returned as data, not exceptions, so the distributed
  map completes for every fastq (we want the full list, not the first failure).
- After the validation map, a lambda/JSONata step flattens results and counts
  discrepancies. If `count > 0`, the SFN transitions to a `Fail` state with a
  cause containing the discrepancy list, which happens **before** the URI swap
  and the `ReadSetsAdded` event.
- Genuine infrastructure errors (lambda faults, decompression job failures) keep
  their existing retry/catch behaviour and fail the SFN as before.

## Infrastructure changes

- New detail-type / source constants in `infrastructure/stage/constants.ts`:
  `READ_COUNT_CALCULATION_REQUEST_SYNC_DETAIL_TYPE`,
  `RAW_MD5SUM_CALCULATION_REQUEST_SYNC_DETAIL_TYPE`,
  `FASTQ_SYNC_DETAIL_TYPE`.
- Inject these as substitutions in
  `infrastructure/stage/step-functions/index.ts`.
- Register the two new lambdas in `infrastructure/stage/lambdas/interfaces.ts`
  (`needsOrcabusApiToolsLayer: true`).
- Add the new lambdas to `fastqSetAddReadSetLambdaList` in
  `infrastructure/stage/step-functions/interfaces.ts`. `fastqSetAddReadSet`
  already declares `needsPutEvents: true` and `needsDistributedMapPolicy: true`,
  which covers publishing the manager events and running the extra distributed
  map. The task-token PutEvents targets are also on `OrcaBusMain`, already
  granted via `grantPutEventsTo`.

_Content was rephrased for compliance with licensing restrictions._
