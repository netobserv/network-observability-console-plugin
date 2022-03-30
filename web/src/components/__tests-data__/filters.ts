import { findFilter } from '../../utils/filter-definitions';
import { Filter } from '../../model/filters';

export const FiltersSample: Filter[] = [
  {
    def: findFilter((k: string) => k, 'src_port')!,
    values: [{ v: '1234' }]
  },
  {
    def: findFilter((k: string) => k, 'dst_port')!,
    values: [{ v: '5678' }]
  },
  {
    def: findFilter((k: string) => k, 'src_name')!,
    values: [{ v: 'pod or service' }]
  },
  {
    def: findFilter((k: string) => k, 'dst_name')!,
    values: [{ v: 'another pod or service' }]
  }
];

export const FTPSrcPortSample: Filter = {
  def: findFilter((k: string) => k, 'src_port')!,
  values: [{ v: '21', display: 'ftp' }]
};
