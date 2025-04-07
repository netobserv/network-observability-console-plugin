import { prune } from './utils';

const PRUNE_DATA = {
  abc: {
    '123': {}
  },
  test1: {
    num: NaN,
    str: '',
    bool: null
  },
  test2: {
    num: NaN,
    str: '',
    bool: null
  },
  test3: {
    child: {
      grandchild: {}
    }
  },
  test4: {
    arr1: [NaN, '', undefined, null, {}],
    arr2: []
  }
};

const PRUNE_SAMPLE = {
  test2: {},
  test3: {
    child: {}
  },
  test4: {
    arr1: []
  }
};

describe('prune', () => {
  it('Prunes all empty data when no sample is provided', () => {
    const result = prune(PRUNE_DATA);
    expect(result.abc).toBeUndefined();
    expect(result.test1).toBeUndefined();
    expect(result.test2).toBeUndefined();
    expect(result.test3).toBeUndefined();
    expect(result.test4).toBeUndefined();
  });

  it('Only prunes empty data without explicit empty samples', () => {
    const result = prune(PRUNE_DATA, PRUNE_SAMPLE);
    expect(result.abc).toBeUndefined();
    expect(result.test1).toBeUndefined();
    expect(result.test2).toEqual({});
    expect(result.test3.child).toEqual({});
    expect(result.test4.arr1).toEqual([]);
    expect(result.test4.arr2).toBeUndefined();
  });
});
