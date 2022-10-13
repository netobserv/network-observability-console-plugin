import { scale } from './count';

export const byteRateFormat = (bps: number, precision = 1, limitReached?: boolean) => {
  return `${byteFormat(bps, precision, limitReached)}ps`;
};

export const byteFormat = (bytes: number, precision = 1, limitReached?: boolean) => {
  const [value, factor] = scale(bytes, true, precision);
  return `${toPrecision(value, precision)}${limitReached ? '+' : ''} ${factor}B`;
};

export const simpleValueFormat = (count: number, precision = 1): string => {
  const [value, factor] = scale(count, true, precision);
  return `${toPrecision(value, precision)}${factor}`;
};

export const simpleRateFormat = (count: number, precision = 1): string => {
  const [value, factor] = scale(count, true, precision);
  return `${toPrecision(value, precision)} ${factor}/sec`;
};

const toPrecision = (value: number, precision: number): string => {
  return String(Number(value.toFixed(precision)));
};
