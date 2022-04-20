export const roundTwoDigits = (count: number) => {
  return Math.round(count * 100) / 100;
};

export const elementPerMinText = (count: number): string => {
  if (count < 10000) {
    return `${roundTwoDigits(count)}/min`;
  } else {
    return `${roundTwoDigits(count / 60)}/sec`;
  }
};
