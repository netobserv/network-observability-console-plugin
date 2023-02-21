import { RecordType } from './flow-query';
import { RawQuickFilter } from './quick-filters';

export type Config = {
  recordTypes: RecordType[];
  portNaming: {
    enable: boolean;
    portNames: Map<string, string>;
  };
  quickFilters: RawQuickFilter[];
  alertNamespaces: string[];
};

export const defaultConfig: Config = {
  recordTypes: ['flowLog'],
  portNaming: {
    enable: true,
    portNames: new Map()
  },
  quickFilters: [],
  alertNamespaces: ['netobserv']
};
