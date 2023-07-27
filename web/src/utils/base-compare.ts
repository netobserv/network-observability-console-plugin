import _ from 'lodash';

export const compareNumbers = (a: number, b: number) => {
  if (!isNaN(a) && !isNaN(b)) {
    return a - b;
  } else if (!isNaN(a)) {
    return 1;
  }
  return -1;
};

export const compareStrings = (a: string, b: string) => {
  if (a && b) {
    return a.localeCompare(b);
  } else if (a) {
    return 1;
  }
  return -1;
};

// isEqual with type assertion (lodash uses "any")
export const isEqual = <T>(a: T, b: T) => _.isEqual(a, b);
