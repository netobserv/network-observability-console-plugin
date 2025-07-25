import { Field } from '../api/ipfix';

export type FieldType = 'string' | 'string[]' | 'number' | 'number[]';

export type FieldFormat = 'IP';

export interface FieldConfig {
  name: Field;
  type: FieldType;
  format?: FieldFormat;
  description: string;
}
