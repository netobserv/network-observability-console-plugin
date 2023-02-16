import { scale } from './count';

export const valueFormat = (v: number, precision = 1, unit = '', limitReached?: boolean) => {
  const [value, factor] = scale(v, true, precision);
  return `${toPrecision(value, precision)}${limitReached ? '+' : ''} ${factor}${unit}`;
};

const toPrecision = (value: number, precision: number): string => {
  return String(Number(value.toFixed(precision)));
};
