import * as _ from 'lodash';
import { Column, getDefaultColumns } from '../../utils/columns';

// Customize columns order
const columns = getDefaultColumns(k => k);
_.shuffle(columns);
export const ColumnsSample: Column[] = columns;
