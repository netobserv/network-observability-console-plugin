import { Column, getDefaultColumns } from '../../utils/columns';
import * as _ from 'lodash';

// Customize columns order
const columns = getDefaultColumns();
_.shuffle(columns);
export const ColumnsSample: Column[] = columns;
