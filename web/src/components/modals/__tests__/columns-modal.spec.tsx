import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { Config, defaultConfig } from '../../../model/config';
import { ColumnConfigSampleDefs, ShuffledColumnSample } from '../../__tests-data__/columns';
import ColumnsModal from '../columns-modal';

describe('<ColumnsModal />', () => {
  const props = {
    isModalOpen: true,
    setModalOpen: jest.fn(),
    config: { ...defaultConfig, columns: ColumnConfigSampleDefs } as Config,
    columns: ShuffledColumnSample,
    setColumns: jest.fn(),
    setColumnSizes: jest.fn(),
    id: 'columns-modal'
  };

  it('should render component', async () => {
    const wrapper = shallow(<ColumnsModal {...props} />);
    expect(wrapper.find(ColumnsModal)).toBeTruthy();
  });

  it('should save once', async () => {
    const wrapper = mount(<ColumnsModal {...props} />);
    const confirmButton = wrapper.find('.pf-v6-c-button.pf-m-primary');
    expect(confirmButton.length).toEqual(1);

    confirmButton.at(0).simulate('click');
    expect(props.setColumns).toHaveBeenCalledTimes(1);
  });

  it('should update columns selected on save', async () => {
    const wrapper = mount(<ColumnsModal {...props} />);
    expect(props.setColumns).toHaveBeenNthCalledWith(1, props.columns);
    //unselect first and second columns
    const updatedColumns = [...props.columns];
    updatedColumns[0].isSelected = !updatedColumns[0].isSelected;
    updatedColumns[1].isSelected = !updatedColumns[1].isSelected;
    wrapper
      .find('[aria-labelledby="table-column-management-item-0"]')
      .last()
      .simulate('change', { target: { id: updatedColumns[0].id } });
    wrapper
      .find('[aria-labelledby="table-column-management-item-1"]')
      .last()
      .simulate('change', { target: { id: updatedColumns[1].id } });
    wrapper.find('.pf-v6-c-button.pf-m-primary').at(0).simulate('click');
    expect(props.setColumns).toHaveBeenNthCalledWith(2, updatedColumns);
  });
});
