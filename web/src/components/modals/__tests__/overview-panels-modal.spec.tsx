import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { RecordType } from '../../../model/flow-query';
import { ShuffledDefaultPanels } from '../../__tests-data__/panels';
import OverviewPanelsModal from '../overview-panels-modal';

describe('<OverviewPanelsModal />', () => {
  const props = {
    isModalOpen: true,
    setModalOpen: jest.fn(),
    recordType: 'flowLog' as RecordType,
    panels: ShuffledDefaultPanels,
    setPanels: jest.fn(),
    customIds: [],
    features: [],
    id: 'panels-modal'
  };

  it('should render component', async () => {
    const wrapper = shallow(<OverviewPanelsModal {...props} />);
    expect(wrapper.find(OverviewPanelsModal)).toBeTruthy();
  });

  it('should save once', async () => {
    const wrapper = mount(<OverviewPanelsModal {...props} />);
    const confirmButton = wrapper.find('.pf-v6-c-button.pf-m-primary');
    expect(confirmButton.length).toEqual(1);

    confirmButton.at(0).simulate('click');
    expect(props.setPanels).toHaveBeenCalledTimes(1);
  });

  it('should update panels selected on save', async () => {
    const wrapper = mount(<OverviewPanelsModal {...props} />);
    expect(props.setPanels).toHaveBeenNthCalledWith(1, props.panels);
    //unselect first and second panels
    const updatedpanels = [...props.panels];
    updatedpanels[0].isSelected = !updatedpanels[0].isSelected;
    updatedpanels[1].isSelected = !updatedpanels[1].isSelected;
    wrapper
      .find('[aria-labelledby="overview-panel-management-item-0"]')
      .last()
      .simulate('change', { target: { id: updatedpanels[0].id } });
    wrapper
      .find('[aria-labelledby="overview-panel-management-item-1"]')
      .last()
      .simulate('change', { target: { id: updatedpanels[1].id } });
    wrapper.find('.pf-v6-c-button.pf-m-primary').at(0).simulate('click');
    expect(props.setPanels).toHaveBeenNthCalledWith(2, updatedpanels);
  });
});
