import { RecordType } from './flow-query';
import { RawQuickFilter } from './quick-filters';

export type Feature = 'pktDrop' | 'dnsTracking' | 'flowRTT' | 'tcpRetrans';

export type Config = {
  buildVersion: string;
  buildDate: string;
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
  buildVersion: 'Unknown',
  buildDate: 'Unknown',
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
