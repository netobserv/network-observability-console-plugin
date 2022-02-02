import * as _ from 'lodash';
import { Column, ColumnsId, getDefaultColumns } from '../../utils/columns';

// Customize columns order
export const DefaultColumns = getDefaultColumns((k: string) => k);
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
