export const roundTwoDigits = (count: number) => {
  return Math.round(count * 100) / 100;
};

export const elementPerMinText = (count: number): string => {
  const [value, unit] = scale(count);
  return `${value.toFixed(1)} ${unit}/sec`;
};

export const scale = (count: number, si = false, dp = 1): [number, string] => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(count) < thresh) {
    return [count, ''];
  }

  const units = si ? ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'] : ['Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi'];
  let u = -1;
  const r = 10 ** dp;

  do {
    count /= thresh;
    ++u;
  } while (Math.round(Math.abs(count) * r) / r >= thresh && u < units.length - 1);

  return [count, units[u]];
};
