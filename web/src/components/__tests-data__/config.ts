import { ColumnConfigSampleDefs } from './columns';
import { FilterDefinitionSample } from './filters';

export const FullConfigResultSample = {
  recordTypes: ['flowLog', 'newConnection', 'heartbeat', 'endConnection'],
  portNaming: {
    enable: true,
    portNames: new Map([['3100', 'loki']])
  },
  columns: ColumnConfigSampleDefs,
  filters: FilterDefinitionSample,
  quickFilters: [],
  sampling: 1,
  features: ['pktDrop', 'dnsTracking', 'flowRTT']
};

export const SimpleConfigResultSample = {
  recordTypes: ['flowLog'],
  portNaming: {
    enable: true,
    portNames: new Map([])
  },
  columns: [],
  filters: [],
  quickFilters: [],
  sampling: 50,
  features: []
};
