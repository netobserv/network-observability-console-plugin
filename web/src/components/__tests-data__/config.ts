import { defaultConfig } from '../../model/config';
import { ColumnConfigSampleDefs } from './columns';
import { FilterDefinitionSample } from './filters';

export const FullConfigResultSample = {
  ...defaultConfig,
  recordTypes: ['flowLog', 'newConnection', 'heartbeat', 'endConnection'],
  portNaming: {
    enable: true,
    portNames: new Map([['3100', 'loki']])
  },
  columns: ColumnConfigSampleDefs,
  filters: FilterDefinitionSample,
  sampling: 1,
  features: ['pktDrop', 'dnsTracking', 'flowRTT']
};

export const SimpleConfigResultSample = {
  ...defaultConfig,
  recordTypes: ['flowLog']
};
