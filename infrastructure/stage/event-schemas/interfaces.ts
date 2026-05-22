export type SchemaNames =
  | 'FastqListRowsAdded'
  | 'ReadSetsAdded'
  | 'SrmFailureCleanupFastqCompleted';

export const schemaNamesList: SchemaNames[] = [
  'FastqListRowsAdded',
  'ReadSetsAdded',
  'SrmFailureCleanupFastqCompleted',
];

export interface BuildSchemaProps {
  schemaName: SchemaNames;
}
