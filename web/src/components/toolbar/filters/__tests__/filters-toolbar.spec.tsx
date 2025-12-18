import { Button, Dropdown, DropdownItem, Toolbar, ToolbarItem } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { FilterDefinitionSample } from '../../../../components/__tests-data__/filters';
import { actOn } from '../../../../components/__tests__/common.spec';
import FiltersToolbar, { FiltersToolbarProps } from '../../../toolbar/filters-toolbar';

describe('<FiltersToolbar />', () => {
  const props: FiltersToolbarProps = {
    filters: { match: 'all', list: [] },
    filterDefinitions: FilterDefinitionSample,
    forcedFilters: undefined,
    skipTipsDelay: true,
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
    resetFilters: jest.fn(),
    id: 'filter-toolbar',
    queryOptionsProps: {
      limit: 100,
      recordType: 'allConnections',
      dataSource: 'auto',
      allowFlow: true,
      allowConnection: true,
      allowProm: true,
      allowLoki: true,
      allowPktDrops: true,
      useTopK: false,
      packetLoss: 'all',
      setLimit: jest.fn(),
      setPacketLoss: jest.fn(),
      setRecordType: jest.fn(),
      setDataSource: jest.fn()
    },
    quickFilters: [],
    isFullScreen: false,
    setFullScreen: jest.fn()
  };

  beforeEach(() => {
    props.setFilters = jest.fn();
    props.clearFilters = jest.fn();
  });

  it('should render component', async () => {
    const wrapper = shallow(<FiltersToolbar {...props} />);
    expect(wrapper.find(FiltersToolbar)).toBeTruthy();
    expect(wrapper.find(Toolbar)).toBeTruthy();
    expect(wrapper.find(ToolbarItem)).toHaveLength(3);
    expect(wrapper.find(Dropdown)).toBeTruthy();
    expect(wrapper.find(Button)).toBeTruthy();
  });

  it('should open and close', async () => {
    const wrapper = mount(<FiltersToolbar {...props} />);
    expect(wrapper.find('#filter-popper').length).toBe(0);
    expect(wrapper.find('.column-filter-item').length).toBe(0);

    //open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);
    expect(wrapper.find('.column-filter-item').length).toBeGreaterThan(0);
    expect(wrapper.find(DropdownItem).length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);
    expect(wrapper.find('.column-filter-item').length).toBe(0);

    //close popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    //setFilters should not be called at startup, because filters are supposed to be already initialized from URL
    expect(props.setFilters).toHaveBeenCalledTimes(0);
  });

  it('should show tips on complex fields', async () => {
    const wrapper = mount(<FiltersToolbar {...props} />);

    //open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);

    //select name
    await actOn(() => wrapper.find('[id="name"]').last().simulate('click'), wrapper);
    let tips = wrapper.find('#tips').at(0).getElement();
    expect(String(tips.props.children[0].props.children)).toContain('Specify a single kubernetes name');

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);

    //select port
    await actOn(() => wrapper.find('[id="port"]').last().simulate('click'), wrapper);
    tips = wrapper.find('#tips').at(0).getElement();
    expect(String(tips.props.children[0].props.children)).toContain('Specify a single port');

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);

    //select address
    await actOn(() => wrapper.find('[id="address"]').last().simulate('click'), wrapper);
    tips = wrapper.find('#tips').at(0).getElement();
    expect(String(tips.props.children[0].props.children)).toContain('Specify a single IP');

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);
    //select Protocol
    await actOn(() => wrapper.find('[id="protocol"]').last().simulate('click'), wrapper);
    tips = wrapper.find('#tips').at(0).getElement();
    expect(String(tips.props.children[0].props.children)).toContain('Specify a single protocol');
  });
});
