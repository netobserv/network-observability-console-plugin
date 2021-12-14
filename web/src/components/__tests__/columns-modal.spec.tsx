import * as React from 'react';
import { mount, shallow } from 'enzyme';

import ColumnsModal from "../columns-modal";
import { ColumnsSample } from '../__tests-data__/columns'

describe("<ColumnsModal />", () => {
  const props = {
    isModalOpen: true,
    setModalOpen: jest.fn(),
    columns: ColumnsSample,
    setColumns: jest.fn(),
    id: "columns-modal",
  }
  it('should render component', () => {
    const wrapper = shallow(
      <ColumnsModal {...props} />
    );
    expect(wrapper.find(ColumnsModal)).toBeTruthy();
  });
  it('should save once', () => {
    const wrapper = mount(
      <ColumnsModal {...props} />
    );
    const confirmButton = wrapper.find(".pf-c-button.pf-m-primary");
    expect(confirmButton.length).toEqual(1);

    confirmButton.at(0).simulate('click');
    expect(props.setColumns).toHaveBeenCalledTimes(1);
  });
  it('should update columns selected on save', () => {
    const wrapper = mount(
      <ColumnsModal {...props} />
    );
    expect(props.setColumns).toHaveBeenNthCalledWith(1, props.columns);
    //unselect first and second columns 
    const updatedColumns = [...props.columns];
    updatedColumns[0].isSelected = false;
    updatedColumns[1].isSelected = false;
    wrapper.find('[aria-labelledby="table-column-management-item-0"]').at(0).simulate('click');
    wrapper.find('[aria-labelledby="table-column-management-item-1"]').at(0).simulate('click');
    wrapper.find(".pf-c-button.pf-m-primary").at(0).simulate('click');
    expect(props.setColumns).toHaveBeenNthCalledWith(2, updatedColumns);
  });
});