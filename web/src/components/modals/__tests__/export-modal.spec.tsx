import * as React from 'react';
import { shallow } from 'enzyme';

import ExportModal, { ExportModalProps } from '../export-modal';
import { ShuffledDefaultColumns } from '../../../components/__tests-data__/columns';

describe('<ExportModal />', () => {
  const props: ExportModalProps = {
    isModalOpen: true,
    setModalOpen: jest.fn(),
    columns: ShuffledDefaultColumns,
    filters: [],
    range: 300,
    flowQuery: { recordType: 'flowLog', reporter: 'destination', limit: 100, filters: '', packetLoss: 'all' },
    id: 'export-modal'
  };
  it('should render component', async () => {
    const wrapper = shallow(<ExportModal {...props} />);
    expect(wrapper.find(ExportModal)).toBeTruthy();
  });
});
