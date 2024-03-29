import * as _ from 'lodash';
import parse from 'parse-duration';

// Conversions between units and milliseconds
const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const units = { w, d, h, m, s };

// Converts a duration like "1h 10m 23s" to milliseconds or throws an error if the duration could not be
// parsed
export const parseDuration = (duration: string): number => {
  return parse(duration, 'ms')!;
};

// Formats a duration in milliseconds like "1h 10m"
export const formatDuration = (ms: number): string => {
  if (!_.isFinite(ms) || ms < 0) {
    return '';
  }
  let remaining = ms;
  let str = '';
  _.each(units, (factor, unit) => {
    const n = Math.floor(remaining / factor);
    if (n > 0) {
      str += `${n}${unit} `;
      remaining -= n * factor;
    }
  });
  return _.trim(str);
};

export const roundDuration = (value: number, decimalPlaces = 2): number => {
  return Number(Math.round(parseFloat(value + 'e' + decimalPlaces)) + 'e-' + decimalPlaces);
};

export const formatDurationAboveNanosecond = (ns: number): string => {
  if (ns < 1000000) {
    return `${ns}ns`;
  }
  // convert to ms and format accordingly
  return formatDurationAboveMillisecond(roundDuration(ns / 1000000));
};

export const formatDurationAboveMillisecond = (ms: number): string => {
  if (ms < 1) {
    // Sometimes ms is 0. Sometimes could even be negative (unsynced server time?)
    return '< 1ms';
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return formatDuration(ms);
};

export const getDateFromSecondsString = (seconds: string): Date => {
  const num = Number(seconds) * s;
  if (!_.isEmpty(seconds) && num > 0) {
    return new Date(num);
  } else {
    return new Date('invalid');
  }
};

export const getDateStringInSeconds = (date: Date): string => {
  return (date.getTime() / s).toString();
};

export const getDateMsInSeconds = (time: number): number => {
  return Math.floor(time / s);
};

export const getDateSInMiliseconds = (time: number): number => {
  return time * s;
};
