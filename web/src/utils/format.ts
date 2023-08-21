import { scale } from './count';

export const valueFormat = (v: number, precision = 1, unit = '', limitReached?: boolean, factorBefore = false) => {
  const [value, factor] = scale(v, true, precision);
  if (factorBefore) {
    return `${toPrecision(value, precision)}${factor}${limitReached ? '+' : ''} ${unit}`;
  }
  return `${toPrecision(value, precision)}${limitReached ? '+' : ''} ${factor}${unit}`;
};

const toPrecision = (value: number, precision: number): string => {
  return String(Number(value.toFixed(precision)));
};
