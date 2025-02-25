import { mount } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';

// await for act and promise after a timeout
// mainly to solve popper issues https://github.com/floating-ui/react-popper/issues/350
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actOn = async (action: () => void, wrapper: any, timeout = 100): Promise<void> => {
  await act(async () => {
    action();
    await new Promise(resolve => setTimeout(resolve, timeout));
  });
  wrapper?.update();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const waitForRender = async (wrapper: any, timeout = 100): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, timeout));
  });
  wrapper?.update();
};

describe('common test functions', () => {
  const wrapper = mount(<></>);

  it('should run without error', async () => {
    await actOn(() => {}, wrapper);
    await waitForRender(wrapper);
  });
});
