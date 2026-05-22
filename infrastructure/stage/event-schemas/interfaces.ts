export type SchemaNames = 'FastqListRowsAdded' | 'ReadSetsAdded' | 'SrmFailureCleanupFastq';

export const schemaNamesList: SchemaNames[] = [
  'FastqListRowsAdded',
  'ReadSetsAdded',
  'SrmFailureCleanupFastq',
];

export interface BuildSchemaProps {
  schemaName: SchemaNames;
}
