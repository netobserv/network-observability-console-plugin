export type FieldType = 'string' | 'string array' | 'number' | 'number array';

export type FieldFormat = 'IP';

export interface FieldConfig {
  name: string;
  type: FieldType;
  format?: FieldFormat;
  description: string;
  filter?: string;
}
