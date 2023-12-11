import * as _ from 'lodash';
import { getDefaultOverviewPanels, OverviewPanel } from '../../utils/overview-panels';

export const SamplePanel = { id: 'top_avg_byte_rates', isSelected: true } as OverviewPanel;
export const DefaultPanels = getDefaultOverviewPanels().filter(p => p.isSelected);
export const ShuffledDefaultPanels: OverviewPanel[] = _.shuffle(DefaultPanels);
