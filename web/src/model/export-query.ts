import * as _ from 'lodash';
import { FlowQuery } from './flow-query';

export const buildExportQuery = (flowQuery: FlowQuery, columns?: string[]) => {
  const query = {
    ...flowQuery,
    format: 'csv'
    // no-explicit-any disabled: URLSearchParams actually accepts any object
    // even though its typescript def doesn't say so
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  if (columns) {
    query.columns = String(columns);
  }
  const omitEmpty = _.omitBy(query, a => a === undefined);
  return new URLSearchParams(omitEmpty).toString();
};
