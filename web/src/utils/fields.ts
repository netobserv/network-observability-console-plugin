export type FieldType = 'string' | 'number';

export interface FieldConfig {
  name: string;
  type: FieldType;
  description: string;
  filter?: string;
}
