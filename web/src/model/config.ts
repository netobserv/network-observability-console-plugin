import { RawQuickFilter } from './quick-filters';

export type Config = {
  portNaming: {
    enable: boolean;
    portNames: Map<string, string>;
  };
  quickFilters: RawQuickFilter[];
  alertNamespaces: String[];
};

export const defaultConfig: Config = {
  portNaming: {
    enable: true,
    portNames: new Map()
  },
  quickFilters: [],
  alertNamespaces: ['netobserv']
};
