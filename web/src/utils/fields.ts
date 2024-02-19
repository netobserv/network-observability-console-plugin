export type FieldType = 'string' | 'number';

export interface FieldConfig {
  name: string;
  type: FieldType;
  description: string;
  // This flag is for documentation only. Use loki.labels instead
  lokiLabel?: boolean;
  filter?: string;
}
