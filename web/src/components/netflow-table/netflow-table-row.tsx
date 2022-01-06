import * as React from 'react';
import { Tr, Td } from '@patternfly/react-table';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import protocols from 'protocol-numbers';

import { ParsedStream } from '../../api/loki';
import { Column, ColumnsId } from '../../utils/columns';
import { formatPort } from '../../utils/port';

const NetflowTableRow: React.FC<{ flow: ParsedStream; columns: Column[] }> = ({ flow, columns }) => {
  const content = c => {
    const value = c.value(flow);
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
        const nsValue = c.id === ColumnsId.srcpod ? flow.labels.SrcNamespace : flow.labels.DstNamespace;
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
        return formatPort(flow.ipfix.SrcPort);
      }
      case ColumnsId.dstport: {
        return formatPort(flow.ipfix.DstPort);
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
