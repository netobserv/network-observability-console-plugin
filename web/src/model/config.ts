import { RecordType } from './flow-query';
import { RawQuickFilter } from './quick-filters';

export type Feature = 'tcpDrop' | 'dnsTracking';

export type Config = {
  recordTypes: RecordType[];
  portNaming: {
    enable: boolean;
    portNames: Map<string, string>;
  };
  quickFilters: RawQuickFilter[];
  alertNamespaces: string[];
  sampling: number;
  features: Feature[];
};

export const defaultConfig: Config = {
  recordTypes: ['flowLog'],
  portNaming: {
    enable: true,
    portNames: new Map()
  },
  quickFilters: [],
  alertNamespaces: ['netobserv'],
  sampling: 50,
  features: []
};
