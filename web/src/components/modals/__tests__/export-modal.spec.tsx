import * as React from 'react';
import { shallow } from 'enzyme';

import ExportModal from '../export-modal';
import { ShuffledDefaultColumns } from '../../../components/__tests-data__/columns';
import { Filter } from '../../../utils/filters';
import { QueryOptions } from '../../../model/query-options';

describe('<ExportModal />', () => {
  const props = {
    isModalOpen: true,
    setModalOpen: jest.fn(),
    queryArguments: {},
    columns: ShuffledDefaultColumns,
    filters: [] as Filter[],
    range: 300,
    queryOptions: { reporter: 'destination', limit: 100 } as QueryOptions,
    id: 'export-modal'
  };
  it('should render component', async () => {
    const wrapper = shallow(<ExportModal {...props} />);
    expect(wrapper.find(ExportModal)).toBeTruthy();
  });
});
