import * as React from 'react';
import { shallow } from 'enzyme';

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
});