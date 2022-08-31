import * as _ from 'lodash';
import { getDefaultOverviewPanels, OverviewPanel } from '../../utils/overview-panels';

export const SamplePanel = { id: 'bar', title: 'Bar Title', isSelected: true } as OverviewPanel;
export const DefaultPanels = getDefaultOverviewPanels((k: string) => k);
export const ShuffledDefaultPanels: OverviewPanel[] = _.shuffle(DefaultPanels);
