import { defaultConfig } from '../../model/config';
import { ColumnConfigSampleDefs, FieldConfigSample } from './columns';
import { FilterDefinitionSample } from './filters';
import { CustomPanelsSample } from './panels';

export const FullConfigResultSample = {
  ...defaultConfig,
  recordTypes: ['flowLog', 'newConnection', 'heartbeat', 'endConnection'],
  portNaming: {
    enable: true,
    portNames: new Map([['3100', 'loki']])
  },
  panels: CustomPanelsSample,
  columns: ColumnConfigSampleDefs,
  filters: FilterDefinitionSample,
  sampling: 1,
  features: ['pktDrop', 'dnsTracking', 'flowRTT'],
  fields: FieldConfigSample
};

export const SimpleConfigResultSample = {
  ...defaultConfig,
  recordTypes: ['flowLog']
};
