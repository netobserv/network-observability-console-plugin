import { Accordion, AccordionItem, Button, Dropdown, Toolbar, ToolbarItem } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { FilterDefinitionSample } from '../../../../components/__tests-data__/filters';
import { actOn } from '../../../../components/__tests__/common.spec';
import FiltersToolbar, { FiltersToolbarProps } from '../../../toolbar/filters-toolbar';

describe('<FiltersToolbar />', () => {
  const props: FiltersToolbarProps = {
    filters: { backAndForth: false, list: [] },
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
      showDuplicates: true,
      allowFlow: true,
      allowConnection: true,
      allowProm: true,
      allowLoki: true,
      allowShowDuplicates: true,
      allowPktDrops: true,
      deduperMark: true,
      useTopK: false,
      match: 'all',
      packetLoss: 'all',
      setLimit: jest.fn(),
      setMatch: jest.fn(),
      setPacketLoss: jest.fn(),
      setShowDuplicates: jest.fn(),
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
    expect(wrapper.find('.column-filter-item').length).toBe(0);

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);
    expect(wrapper.find('.column-filter-item').length).toBeGreaterThan(0);
    expect(wrapper.find(Accordion).length).toBe(1);
    expect(wrapper.find(AccordionItem).length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);
    expect(wrapper.find('.column-filter-item').length).toBe(0);

    //setFilters should not be called at startup, because filters are supposed to be already initialized from URL
    expect(props.setFilters).toHaveBeenCalledTimes(0);
  });

  it('should show tips on complex fields', async () => {
    const wrapper = mount(<FiltersToolbar {...props} />);

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);

    //select Src workload
    await actOn(() => wrapper.find('[id="src_name"]').last().simulate('click'), wrapper);
    let tips = wrapper.find('#tips').at(0).getElement();
    expect(String(tips.props.children[0].props.children)).toContain('Specify a single kubernetes name');

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);

    //select Src port
    await actOn(() => wrapper.find('[id="src_port"]').last().simulate('click'), wrapper);
    tips = wrapper.find('#tips').at(0).getElement();
    expect(String(tips.props.children[0].props.children)).toContain('Specify a single port');

    //open dropdow
    await actOn(() => wrapper.find('#column-filter-toggle').at(0).simulate('click'), wrapper);

    //select Src address
    await actOn(() => wrapper.find('[id="src_address"]').last().simulate('click'), wrapper);
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
