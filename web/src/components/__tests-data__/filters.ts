import { Filter } from '../../utils/filters';
import { ColumnsId } from '../../utils/columns';

export const FiltersSample: Filter[] = [
  {
    colId: ColumnsId.srcport,
    values: [{ v: '1234' }]
  },
  {
    colId: ColumnsId.dstport,
    values: [{ v: '5678' }]
  },
  {
    colId: ColumnsId.srcpod,
    values: [{ v: 'pod or service' }]
  },
  {
    colId: ColumnsId.dstpod,
    values: [{ v: 'another pod or service' }]
  }
];

export const FiltersSample2: Filter[] = [
  {
    colId: ColumnsId.srcport,
    values: [{ v: '1234' }]
  },
  {
    colId: ColumnsId.srcpod,
    values: [{ v: 'pod or service' }]
  }
];

export const FTPSrcPortSample: Filter = {
  colId: ColumnsId.srcport,
  values: [{ v: '21', display: 'ftp' }]
};
