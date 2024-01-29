import { ColumnConfigDef } from '../utils/columns';
import { FilterConfigDef } from './filters';
import { RecordType } from './flow-query';
import { RawQuickFilter } from './quick-filters';

export type Feature = 'multiCluster' | 'zones' | 'pktDrop' | 'dnsTracking' | 'flowRTT';

export type Deduper = {
  mark: boolean;
  merge: boolean;
};

export type Config = {
  buildVersion: string;
  buildDate: string;
  recordTypes: RecordType[];
  portNaming: {
    enable: boolean;
    portNames: Map<string, string>;
  };
  columns: ColumnConfigDef[];
  quickFilters: RawQuickFilter[];
  filters: FilterConfigDef[];
  alertNamespaces: string[];
  sampling: number;
  features: Feature[];
  deduper: Deduper;
};

export const defaultConfig: Config = {
  buildVersion: 'Unknown',
  buildDate: 'Unknown',
  recordTypes: ['flowLog'],
  portNaming: {
    enable: true,
    portNames: new Map()
  },
  columns: [],
  quickFilters: [],
  filters: [],
  alertNamespaces: ['netobserv'],
  sampling: 50,
  features: [],
  deduper: {
    mark: true,
    merge: false
  }
};
