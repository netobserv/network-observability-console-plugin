import { ColumnConfigDef } from '../utils/columns';
import { FieldConfig } from '../utils/fields';
import { FilterConfigDef } from './filters';
import { RecordType } from './flow-query';
import { RawQuickFilter } from './quick-filters';
import { ScopeConfigDef } from './scope';

export type Feature =
  | 'multiCluster'
  | 'zones'
  | 'pktDrop'
  | 'dnsTracking'
  | 'flowRTT'
  | 'udnMapping'
  | 'packetTranslation'
  | 'networkEvents'
  | 'ipsec';

export type HealthRuleThresholds = {
  info?: string;
  warning?: string;
  critical?: string;
};

export type HealthRuleVariant = {
  groupBy: string;
  lowVolumeThreshold?: string;
  thresholds: HealthRuleThresholds;
  upperBound?: string;
};

export type HealthRuleMetadata = {
  template: string;
  mode: string;
  variants: HealthRuleVariant[];
};

export type Config = {
  buildVersion: string;
  buildDate: string;
  recordTypes: RecordType[];
  portNaming: {
    enable: boolean;
    portNames: Map<string, string>;
  };
  panels: string[];
  columns: ColumnConfigDef[];
  quickFilters: RawQuickFilter[];
  filters: FilterConfigDef[];
  scopes: ScopeConfigDef[];
  alertNamespaces: string[];
  sampling: number;
  features: Feature[];
  fields: FieldConfig[];
  dataSources: string[];
  lokiMocks: boolean;
  lokiLabels: string[];
  promLabels: string[];
  maxChunkAgeMs?: number;
  healthRules?: HealthRuleMetadata[];
};

export const defaultConfig: Config = {
  buildVersion: 'Unknown',
  buildDate: 'Unknown',
  recordTypes: ['flowLog'],
  portNaming: {
    enable: true,
    portNames: new Map()
  },
  panels: [],
  columns: [],
  quickFilters: [],
  filters: [],
  scopes: [],
  alertNamespaces: ['netobserv'],
  sampling: 50,
  features: [],
  fields: [],
  dataSources: ['loki', 'prom'],
  lokiMocks: false,
  lokiLabels: [],
  promLabels: [],
  maxChunkAgeMs: undefined,
  healthRules: []
};
