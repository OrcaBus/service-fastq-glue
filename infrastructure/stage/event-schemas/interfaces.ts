export type SchemaNames =
  | 'FastqListRowsAdded'
  | 'ReadSetsAdded'
  | 'SrmFailureCleanupFastqCompleted'
  | 'SequencingRunBclDeletionRequest'
  | 'SequencingRunBclDeletionCompleted'
  | 'SequencingRunFastqArchivingRequest'
  | 'SequencingRunFastqArchivingCompleted';

export const schemaNamesList: SchemaNames[] = [
  'FastqListRowsAdded',
  'ReadSetsAdded',
  'SrmFailureCleanupFastqCompleted',
  'SequencingRunBclDeletionRequest',
  'SequencingRunBclDeletionCompleted',
  'SequencingRunFastqArchivingRequest',
  'SequencingRunFastqArchivingCompleted',
];

export interface BuildSchemaProps {
  schemaName: SchemaNames;
}
