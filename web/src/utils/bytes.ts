import { scale } from './count';

export const bytesPerSeconds = (bps: number) => {
  return `${humanFileSize(bps, true, 0)}ps`;
};

export const humanFileSize = (bytes: number, si = false, dp = 1) => {
  const [value, unit] = scale(bytes, si, dp);
  return `${value.toFixed(dp)} ${unit}B`;
};
