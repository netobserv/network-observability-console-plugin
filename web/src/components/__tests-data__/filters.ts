import { findFilter } from '../../utils/filter-definitions';
import { Filter, FilterId, FilterValue } from '../../model/filters';

const filter = (id: FilterId, values: FilterValue[]): Filter => {
  return {
    def: findFilter((k: string) => k, id)!,
    values: values
  };
};

export const FiltersSample: Filter[] = [
  filter('src_port', [{ v: '1234' }]),
  filter('dst_port', [{ v: '5678' }]),
  filter('src_name', [{ v: 'pod or service' }]),
  filter('dst_name', [{ v: 'another pod or service' }])
];

export const FTPSrcPortSample = filter('src_port', [{ v: '21', display: 'ftp' }]);
