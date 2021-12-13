import * as React from 'react';
import { shallow } from 'enzyme';

import NetflowTable from '../netflow-table';
import NetflowTableRow from '../netflow-table-row';
import { NetflowTableHeader } from '../netflow-table-header';

import { ParsedStream } from '../../api/loki';
import { ColumnsSample } from '../__tests-data__/columns'
import { FlowsSample } from '../__tests-data__/flows'

describe("<NetflowTable />", () => {
    let flows:ParsedStream[] = []
    const setFlows = (f) => {flows = f; return}
    it('should render component', () => {
 	const wrapper = shallow(
 	    <NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />
 	);
 	expect(wrapper.find(NetflowTable)).toBeTruthy();
	expect(wrapper.find(NetflowTableHeader)).toHaveLength(1);
    });
    it('should have table rows', () => {
	flows = FlowsSample
 	const wrapper = shallow(
 	    <NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />
 	);
 	expect(wrapper.find(NetflowTable)).toBeTruthy();
	expect(wrapper.find(NetflowTableRow)).toHaveLength(FlowsSample.length);
    });
    it('should only render given row', () => {
 	const wrapper = shallow(
 	    <NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />
 	);
 	expect(wrapper.find(NetflowTable)).toBeTruthy();
	expect(wrapper.find(NetflowTableRow)).toHaveLength(FlowsSample.length);
    });
});
