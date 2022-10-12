import { scale } from './count';

export const bytesPerSeconds = (bps: number, limitReached?: boolean) => {
  return `${humanFileSize(bps, true, 0, limitReached)}ps`;
};

export const humanFileSize = (bytes: number, si = false, dp = 1, limitReached?: boolean) => {
  const [value, unit] = scale(bytes, si, dp);
  return `${value.toFixed(dp)}${limitReached ? '+' : ''} ${unit}B`;
};
