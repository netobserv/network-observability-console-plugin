import { TFunction } from 'i18next';
import { CUSTOM_TIME_RANGE_KEY } from '../components/time-range-dropdown';

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

export interface TimeRange {
  from: number;
  to: number;
}

export const getTimeRangeOptions = (t: TFunction) => {
  const timeRangeOptions = {
    [CUSTOM_TIME_RANGE_KEY]: t('Custom time range'),
    '5m': t('Last {{count}} minute', { count: 5 }),
    '15m': t('Last {{count}} minute', { count: 15 }),
    '30m': t('Last {{count}} minute', { count: 30 }),
    '1h': t('Last {{count}} hour', { count: 1 }),
    '2h': t('Last {{count}} hour', { count: 2 }),
    '6h': t('Last {{count}} hour', { count: 6 }),
    '12h': t('Last {{count}} hour', { count: 12 }),
    '1d': t('Last {{count}} day', { count: 1 }),
    '2d': t('Last {{count}} day', { count: 2 }),
    '1w': t('Last {{count}} week', { count: 1 }),
    '2w': t('Last {{count}} week', { count: 2 })
  };
  return timeRangeOptions;
};
