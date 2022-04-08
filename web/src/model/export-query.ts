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
  return new URLSearchParams(query).toString();
};
