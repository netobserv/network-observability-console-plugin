import { TFunction } from 'i18next';
import { findFilter } from './filter-definitions';
import { TimeRange } from './datetime';
import { Layer, Match, MetricFunction, MetricType, Reporter } from '../model/flow-query';
import { getURLParam, getURLParamAsNumber, removeURLParam, setURLParam, URLParam } from './url';
import { createFilterValue, DisabledFilters, Filter, FilterId, GroupDisabledKey } from '../model/filters';

const filtersSeparator = ';';
const filterKVSeparator = '=';
const filterValuesSeparator = ',';
export const defaultTimeRange = 300;
export const defaultStep = 60;
const defaultLimit = 100;
export const defaultReporter: Reporter = 'destination';
//TODO: improve performances before applying 'application' layer by default
export const defaultLayer: Layer = 'both';
const defaultMatch: Match = 'all';
export const defaultMetricFunction = 'sum';
export const defaultMetricType = 'bytes';

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

export const getStepFromURL = (): number => {
  const step = getURLParamAsNumber(URLParam.Step);
  if (step) {
    return step;
  }
  return defaultStep;
};

export const getReporterFromURL = (): Reporter => {
  return (getURLParam(URLParam.Reporter) as Reporter | null) || defaultReporter;
};

export const getLayerFromURL = (): Layer => {
  return (getURLParam(URLParam.Layer) as Layer | null) || defaultLayer;
};

export const getLimitFromURL = (): number => {
  return getURLParamAsNumber(URLParam.Limit) || defaultLimit;
};

export const getMatchFromURL = (): Match => {
  return (getURLParam(URLParam.Match) as Match | null) || defaultMatch;
};

export const getFiltersFromURL = (t: TFunction, disabledFilters: DisabledFilters): Promise<Filter[]> => {
  const urlParam = getURLParam(URLParam.Filters) || '';
  const filterPromises: Promise<Filter>[] = [];
  const filters = urlParam.split(filtersSeparator);
  filters.forEach(keyValue => {
    const pair = keyValue.split(filterKVSeparator);
    if (pair.length === 2) {
      const def = findFilter(t, pair[0] as FilterId);
      if (def) {
        const values = pair[1].split(filterValuesSeparator);
        filterPromises.push(
          Promise.all(values.map(v => createFilterValue(def, v))).then(filterValues => {
            filterValues.forEach(fv => {
              if (disabledFilters[def.id]?.split(',').includes(fv.v)) {
                fv.disabled = true;
              }
            });
            return {
              id: def.id,
              def: def,
              disabled: disabledFilters[def.id] === GroupDisabledKey,
              values: filterValues
            };
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
      return filter.def.id + filterKVSeparator + filter.values.map(v => v.v).join(filterValuesSeparator);
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

export const setURLReporter = (reporter: Reporter) => {
  setURLParam(URLParam.Reporter, reporter);
};

export const setURLLayer = (layer: Layer) => {
  setURLParam(URLParam.Layer, layer);
};

export const setURLLimit = (limit: number) => {
  setURLParam(URLParam.Limit, String(limit));
};

export const setURLMatch = (match: Match) => {
  setURLParam(URLParam.Match, match);
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
