import { TFunction } from 'i18next';
import moment from 'moment';
import { CUSTOM_TIME_RANGE_KEY } from '../components/dropdowns/time-range-dropdown';
import { getDateSInMiliseconds } from './duration';

const zeroPad = (number: number) => (number < 10 ? `0${number}` : number);

// Get YYYY-MM-DD date string for a date object
export const toISODateString = (date: Date): string =>
  `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())}`;

export const twentyFourHourTime = (date: Date, showSeconds?: boolean): string => {
  const hours = zeroPad(date.getHours() ?? 0);
  const minutes = `:${zeroPad(date.getMinutes() ?? 0)}`;
  const seconds = showSeconds ? `:${zeroPad(date.getSeconds() ?? 0)}` : '';
  return `${hours}${minutes}${seconds}`;
};

export const getDateFromUnixString = (v: string) => {
  return new Date(Number(v) * 1000);
};

export interface TimeRange {
  from: number;
  to: number;
}

export const getTimeRangeOptions = (t: TFunction) => {
  return {
    [CUSTOM_TIME_RANGE_KEY]: t('Custom time range'),
    '5m': t('Last 5 minutes'),
    '15m': t('Last 15 minutes'),
    '30m': t('Last 30 minutes'),
    '1h': t('Last 1 hour'),
    '2h': t('Last 2 hours'),
    '6h': t('Last 6 hours'),
    '12h': t('Last 12 hours'),
    '1d': t('Last 1 day'),
    '2d': t('Last 2 days'),
    '1w': t('Last 1 week'),
    '2w': t('Last 2 weeks')
  };
};

export const getFormattedDate = (date: Date, format = 'llll') => {
  return moment(date).format(format);
};

export const rangeToSeconds = (range: TimeRange | number): number => {
  if (typeof range === 'number') {
    return range;
  }
  return range.to - range.from;
};

export const computeStepInterval = (range: TimeRange | number) => {
  const seconds = rangeToSeconds(range);
  let interval = Math.floor(seconds / 10);
  if (interval < 30) {
    interval = 30;
  }
  const step = Math.floor(interval / 2);
  return {
    rateIntervalSeconds: interval,
    stepSeconds: step
  };
};

export const getRangeEnd = (range: TimeRange | number): Date => {
  if (typeof range === 'number') {
    return new Date();
  }
  return new Date(getDateSInMiliseconds(range.to));
};
