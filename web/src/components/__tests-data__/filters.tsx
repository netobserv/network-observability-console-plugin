import { ColumnsId, Filter } from '../../utils/columns';

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

export const DateFilterSample1: Filter = {
  colId: ColumnsId.timestamp,
  values: [
    {
      display: 'Wed, 01 Dec 2021 00:00:00 GMT<',
      v: '1638316800<'
    }
  ]
};

export const DateFilterSample2: Filter = {
  colId: ColumnsId.timestamp,
  values: [
    {
      display: '<Sun, 05 Dec 2021 00:00:00 GMT',
      v: '<1638662400'
    }
  ]
};

export const FTPSrcPortSample: Filter = {
  colId: ColumnsId.srcport,
  values: [{ v: '21', display: 'ftp' }]
};
