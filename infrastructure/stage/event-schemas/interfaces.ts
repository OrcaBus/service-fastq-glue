export type SchemaNames = 'FastqListRowsAdded' | 'ReadSetsAdded';

export const schemaNamesList: SchemaNames[] = ['FastqListRowsAdded', 'ReadSetsAdded'];

export interface BuildSchemaProps {
  schemaName: SchemaNames;
}
