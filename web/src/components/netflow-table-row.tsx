import * as React from 'react';

import { ParsedStream } from '../api/loki';
import { Tr, Td } from '@patternfly/react-table';
import { Column, ColumnsId, getFlowValueFromColumnId } from '../utils/columns';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import protocols from 'protocol-numbers';
import { formatPort } from '../utils/port';

const NetflowTableRow: React.FC<{ flow: ParsedStream; columns: Column[] }> = ({ flow, columns }) => {
  const content = c => {
    const value = getFlowValueFromColumnId(flow, c.id);
    switch (c.id) {
      case ColumnsId.timestamp: {
        return (
          <div>
            <span>{new Date(value).toDateString()}</span>{' '}
            <span className="text-muted">{new Date(value).toLocaleTimeString()}</span>
          </div>
        );
      }
      case ColumnsId.srcpod:
      case ColumnsId.dstpod: {
        const nsValue = getFlowValueFromColumnId(
          flow,
          c.id === ColumnsId.srcpod ? ColumnsId.srcnamespace : ColumnsId.dstnamespace
        );
        if (value && nsValue) {
          return <ResourceLink kind="Pod" name={value.toString()} namespace={nsValue.toString()} />;
        } else {
          return '';
        }
      }
      case ColumnsId.srcnamespace:
      case ColumnsId.dstnamespace: {
        if (value) {
          return <ResourceLink kind="Namespace" name={value.toString()} />;
        } else {
          return '';
        }
      }
      case ColumnsId.srcport: {
        return formatPort(flow.value.IPFIX.SrcPort);
      }
      case ColumnsId.dstport: {
        return formatPort(flow.value.IPFIX.DstPort);
      }
      case ColumnsId.proto:
        if (value) {
          return protocols[value].name;
        } else {
          return '';
        }
      default:
        return value;
    }
  };
  return (
    <Tr>
      {columns.map(c => (
        <Td key={c.id}>{content(c)}</Td>
      ))}
    </Tr>
  );
};

export default NetflowTableRow;
