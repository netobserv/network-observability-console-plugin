import { TFunction } from 'i18next';
import { findFilter } from './filter-definitions';
import { TimeRange } from './datetime';
import { Match, MetricFunction, MetricType, PacketLoss, RecordType, Reporter } from '../model/flow-query';
import { getURLParam, getURLParamAsNumber, removeURLParam, setURLParam, URLParam } from './url';
import { createFilterValue, DisabledFilters, Filter, filterKey, fromFilterKey } from '../model/filters';

const filtersSeparator = ';';
const filterKVSeparator = '=';
const filterValuesSeparator = ',';
export const defaultTimeRange = 300;
export const defaultRecordType: RecordType = 'flowLog';
export const defaultReporter: Reporter = 'destination';
export const defaultMatch: Match = 'all';
export const defaultPacketLoss: PacketLoss = 'all';
export const defaultMetricFunction: MetricFunction = 'last';
export const defaultMetricType: MetricType = 'bytes';

export const flowdirToReporter: { [flowdir: string]: Reporter } = {
  '0': 'destination',
  '1': 'source',
  '': 'both'
};

export const getRangeFromURL = (): number | TimeRange => {
  const timeRange = getURLParamAsNumber(URLParam.TimeRange);
  const startTime = getURLParamAsNumber(URLParam.StartTime);
  const endTime = getURLParamAsNumber(URLParam.EndTime);
  if (timeRange) {
    return timeRange;
  } else if (startTime && endTime) {
    return { from: startTime, to: endTime };
  }
  return defaultTimeRange;
};

export const getRecordTypeFromURL = (): RecordType => {
  return (getURLParam(URLParam.RecordType) as RecordType | null) || defaultRecordType;
};

export const getReporterFromURL = (): Reporter => {
  return (getURLParam(URLParam.Reporter) as Reporter | null) || defaultReporter;
};

export const getLimitFromURL = (fallback: number): number => {
  return getURLParamAsNumber(URLParam.Limit) || fallback;
};

export const getMatchFromURL = (): Match => {
  return (getURLParam(URLParam.Match) as Match | null) || defaultMatch;
};

export const getPacketLossFromURL = (): PacketLoss => {
  return (getURLParam(URLParam.PacketLoss) as PacketLoss | null) || defaultPacketLoss;
};

export const getFiltersFromURL = (t: TFunction, disabledFilters: DisabledFilters): Promise<Filter[]> | undefined => {
  const urlParam = getURLParam(URLParam.Filters);
  //skip filters only if url param is missing
  if (urlParam === null) {
    return undefined;
  }
  const filterPromises: Promise<Filter>[] = [];
  const filters = urlParam.split(filtersSeparator);
  filters.forEach(keyValue => {
    const pair = keyValue.split(filterKVSeparator);
    if (pair.length === 2) {
      const { id, not } = fromFilterKey(pair[0]);
      const def = findFilter(t, id);
      if (def) {
        const disabledValues = disabledFilters[pair[0]]?.split(',') || [];
        const values = pair[1].split(filterValuesSeparator);
        filterPromises.push(
          Promise.all(values.map(v => createFilterValue(def, v))).then(filterValues => {
            filterValues.forEach(fv => {
              if (disabledValues.includes(fv.v)) {
                fv.disabled = true;
              }
            });
            const f: Filter = {
              def: def,
              not: not,
              values: filterValues
            };
            return f;
          })
        );
      }
    }
  });
  return Promise.all(filterPromises);
};

export const setURLFilters = (filters: Filter[]) => {
  const urlFilters = filters
    .map(filter => {
      return filterKey(filter) + filterKVSeparator + filter.values.map(v => v.v).join(filterValuesSeparator);
    })
    .join(filtersSeparator);
  setURLParam(URLParam.Filters, urlFilters);
};

export const setURLRange = (range: number | TimeRange) => {
  if (typeof range === 'number') {
    setURLParam(URLParam.TimeRange, String(range));
    removeURLParam(URLParam.StartTime);
    removeURLParam(URLParam.EndTime);
  } else if (typeof range === 'object') {
    setURLParam(URLParam.StartTime, String(range.from));
    setURLParam(URLParam.EndTime, String(range.to));
    removeURLParam(URLParam.TimeRange);
  }
};

export const setURLRecortType = (recordType: RecordType) => {
  setURLParam(URLParam.RecordType, recordType);
};

export const setURLReporter = (reporter: Reporter) => {
  setURLParam(URLParam.Reporter, reporter);
};

export const setURLLimit = (limit: number) => {
  setURLParam(URLParam.Limit, String(limit));
};

export const setURLMatch = (match: Match) => {
  setURLParam(URLParam.Match, match);
};

export const setURLPacketLoss = (pl: PacketLoss) => {
  setURLParam(URLParam.PacketLoss, pl);
};

export const setURLMetricFunction = (metricFunction?: MetricFunction) => {
  if (metricFunction) {
    setURLParam(URLParam.MetricFunction, metricFunction);
  } else {
    removeURLParam(URLParam.MetricFunction);
  }
};

export const setURLMetricType = (metricType?: MetricType) => {
  if (metricType) {
    setURLParam(URLParam.MetricType, metricType);
  } else {
    removeURLParam(URLParam.MetricType);
  }
};
