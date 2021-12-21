import * as React from 'react';
import { TableComposable, Tbody } from '@patternfly/react-table';
import { ParsedStream } from '../api/loki';
import { Column, ColumnsId, NetflowTableHeader } from './netflow-table-header';
import NetflowTableRow from './netflow-table-row';
import protocols from 'protocol-numbers';
import { ipCompare } from '../utils/ip';
import { formatPort } from '../utils/port';

const NetflowTable: React.FC<{
  flows: ParsedStream[];
  setFlows: React.Dispatch<React.SetStateAction<ParsedStream[]>>;
  columns: Column[];
}> = ({ flows, setFlows, columns }) => {
  // index of the currently active column
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(-1);

  // sort direction of the currently active column
  const [activeSortDirection, setActiveSortDirection] = React.useState<string>('asc');

  //Sort handler
  const onSort = (event, index, direction) => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
    // sorts the rows
    const updatedFlows = flows.sort((a, b): number => {
      let flow1: ParsedStream;
      let flow2: ParsedStream;
      if (direction === 'desc') {
        flow1 = a;
        flow2 = b;
      } else {
        flow1 = b;
        flow2 = a;
      }
      switch (index) {
        case ColumnsId.date: {
          return flow1.value.timestamp - flow2.value.timestamp;
        }
        case ColumnsId.srcpod: {
          const flow1PodName = flow1.value.IPFIX.SrcPod ? flow1.value.IPFIX.SrcPod : '';
          const flow2PodName = flow2.value.IPFIX.SrcPod ? flow2.value.IPFIX.SrcPod : '';
          return flow1PodName.localeCompare(flow2PodName);
        }
        case ColumnsId.dstpod: {
          const flow1PodName = flow1.value.IPFIX.DstPod ? flow1.value.IPFIX.DstPod : '';
          const flow2PodName = flow2.value.IPFIX.DstPod ? flow2.value.IPFIX.DstPod : '';
          return flow1PodName.localeCompare(flow2PodName);
        }
        case ColumnsId.srcnamespace: {
          const flow1NsName = flow1.labels['SrcNamespace'] ? flow1.labels['SrcNamespace'] : '';
          const flow2NsName = flow2.labels['SrcNamespace'] ? flow2.labels['SrcNamespace'] : '';
          return flow1NsName.localeCompare(flow2NsName);
        }
        case ColumnsId.dstnamespace: {
          const flow1NsName = flow1.labels['DstNamespace'] ? flow1.labels['DstNamespace'] : '';
          const flow2NsName = flow2.labels['DstNamespace'] ? flow2.labels['DstNamespace'] : '';
          return flow1NsName.localeCompare(flow2NsName);
        }
        case ColumnsId.srcport: {
          return formatPort(flow1.value.IPFIX.SrcPort).localeCompare(formatPort(flow2.value.IPFIX.SrcPort));
        }
        case ColumnsId.dstport: {
          return formatPort(flow1.value.IPFIX.DstPort).localeCompare(formatPort(flow2.value.IPFIX.DstPort));
        }
        case ColumnsId.srcaddr: {
          return ipCompare(flow1.value.IPFIX.SrcAddr, flow2.value.IPFIX.SrcAddr);
        }
        case ColumnsId.dstaddr: {
          return ipCompare(flow1.value.IPFIX.DstAddr, flow2.value.IPFIX.DstAddr);
        }
        case ColumnsId.protocol: {
          return protocols[flow1.value.IPFIX.Proto].name.localeCompare(protocols[flow2.value.IPFIX.Proto].name);
        }
        case ColumnsId.bytes: {
          return flow1.value.IPFIX.Bytes - flow2.value.IPFIX.Bytes;
        }
        case ColumnsId.packets: {
          return flow1.value.IPFIX.Packets - flow2.value.IPFIX.Packets;
        }
      }
      console.log('Unknown column');
      return 0;
    });
    setFlows(updatedFlows);
  };

  return (
    <TableComposable aria-label="Misc table" variant="compact">
      <NetflowTableHeader
        onSort={onSort}
        sortDirection={activeSortDirection}
        sortIndex={activeSortIndex}
        columns={columns}
      />
      <Tbody>
        {flows.map((f, i) => (
          <NetflowTableRow key={i} flow={f} columns={columns} />
        ))}
      </Tbody>
    </TableComposable>
  );
};

export default NetflowTable;
