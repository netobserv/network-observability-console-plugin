import * as _ from 'lodash';
import { Column, ColumnsId, getDefaultColumns, getCommonColumns } from '../../utils/columns';
import { Config } from '../../model/config';

const config = <Config>{ portNaming: { Enable: true, portNames: new Map<string, string>() } };

// Customize columns order
export const DefaultColumns = getDefaultColumns((k: string) => k, config);
export const CommonColumns = getCommonColumns((k: string) => k, config);
export const AllSelectedColumns = DefaultColumns.map(c => {
  c.isSelected = true;
  return c;
});
export const ShuffledDefaultColumns: Column[] = _.shuffle(DefaultColumns);
export function selectOrderedColumnsByIds(ids: ColumnsId[]) {
  return _.cloneDeep(DefaultColumns)
    .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    .map(c => {
      c.isSelected = ids.includes(c.id);
      return c;
    });
}
export function filterOrderedColumnsByIds(ids: ColumnsId[]) {
  return selectOrderedColumnsByIds(ids).filter(c => c.isSelected);
}
