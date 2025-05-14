export type FieldType = 'string' | 'string[]' | 'number' | 'number[]';

export type FieldFormat = 'IP';

export interface FieldConfig {
  name: string;
  type: FieldType;
  format?: FieldFormat;
  description: string;
}
