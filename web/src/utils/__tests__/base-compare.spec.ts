import { compareNumbers, compareStrings } from '../base-compare';

describe('base sorts', () => {
  it('should sort numbers in natural order', () => {
    const sorted = [5, 9, 3, undefined, -1].sort(compareNumbers);
    expect(sorted).toEqual([3, 5, 9, undefined]);
  });

  it('should sort strings in natural order', () => {
    const sorted = ['xyz', 'abc', undefined, 'def'].sort(compareStrings);
    expect(sorted).toEqual(['abc', 'def', 'xyz', undefined]);
  });
});
