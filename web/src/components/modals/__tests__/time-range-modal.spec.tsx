import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { DatePicker, TimePicker } from '@patternfly/react-core';
import { act } from 'react-dom/test-utils';
import { TimeRange } from '../../../utils/datetime';
import TimeRangeModal, { TimeRangeModalProps } from '../time-range-modal';

describe('<ColumnsModal />', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fakeEvent: any = {};
  const props: TimeRangeModalProps = {
    maxChunkAge: NaN,
    isModalOpen: true,
    setModalOpen: jest.fn(),
    range: undefined,
    setRange: jest.fn(),
    id: 'time-range-modal'
  };
  it('should render component', async () => {
    const wrapper = shallow(<TimeRangeModal {...props} />);
    expect(wrapper.find(TimeRangeModal)).toBeTruthy();
  });
  it('should save once', async () => {
    const wrapper = mount(<TimeRangeModal {...props} />);
    const confirmButton = wrapper.find('.pf-c-button.pf-m-primary');
    expect(confirmButton.length).toEqual(1);

    confirmButton.at(0).simulate('click');
    expect(props.setRange).toHaveBeenCalledTimes(1);
  });
  it('should update range on save', async () => {
    const nowRange: TimeRange = {
      from: new Date().setHours(0, 0, 0, 0) / 1000,
      to: new Date().setHours(23, 59, 0, 0) / 1000
    };

    const wrapper = mount(<TimeRangeModal {...props} />);
    expect(props.setRange).toHaveBeenNthCalledWith(1, nowRange);

    const datePickers = wrapper.find(DatePicker);
    const timePickers = wrapper.find(TimePicker);
    //set start date & time and press button
    act(() => {
      datePickers.at(0).props().onChange!(fakeEvent, '2021-12-01', new Date('2021-12-01'));
      // set hours minutes and seconds
      timePickers.at(0).props().onChange!(fakeEvent, '10:15:30');
    });
    nowRange.from = new Date('2021-12-01').setHours(10, 15, 30, 0) / 1000;

    wrapper.find('.pf-c-button.pf-m-primary').at(0).simulate('click');
    expect(props.setRange).toHaveBeenNthCalledWith(2, nowRange);

    //set end date & time and press button
    act(() => {
      datePickers.at(1).props().onChange!(fakeEvent, '2021-12-15', new Date('2021-12-15'));
      // set only hours and minutes, seconds should be automatically set to 0
      timePickers.at(1).props().onChange!(fakeEvent, '23:00');
    });
    nowRange.to = new Date('2021-12-15').setHours(23, 0, 0, 0) / 1000;

    wrapper.find('.pf-c-button.pf-m-primary').at(0).simulate('click');
    expect(props.setRange).toHaveBeenNthCalledWith(3, nowRange);
  });
});
