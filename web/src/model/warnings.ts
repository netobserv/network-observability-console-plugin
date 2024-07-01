export type WarningType = 'slow' | 'cantfetchdrops';

export interface Warning {
  summary: string;
  details?: string;
  type: WarningType;
}
