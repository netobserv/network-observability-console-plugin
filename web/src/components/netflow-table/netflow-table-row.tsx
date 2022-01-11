import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tr, Td } from '@patternfly/react-table';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';

import { FlowDirection, Record } from '../../api/ipfix';
import { Column, ColumnsId } from '../../utils/columns';
import { formatPort } from '../../utils/port';
import { formatProtocol } from '../../utils/protocol';
import { Size } from '../display-dropdown';

import './netflow-table-row.css';

const NetflowTableRow: React.FC<{ flow: Record; columns: Column[]; size: Size }> = ({ flow, columns, size }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const onMouseOver = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (event.currentTarget) {
      const isTruncated =
        event.currentTarget.offsetHeight < event.currentTarget.scrollHeight ||
        event.currentTarget.offsetWidth < event.currentTarget.scrollWidth ||
        event.currentTarget.children[0].className === 'force-truncate';
      event.currentTarget.className = isTruncated
        ? `netflow-table-content truncated ${size}`
        : `netflow-table-content ${size}`;
    }
  };

  const simpleTextWithTooltip = (text: string) => {
    return (
      <div>
        <span>{text}</span>
        <div className="netflow-table-tooltip">{text}</div>
      </div>
    );
  };

  const content = (c: Column) => {
    const value = c.value(flow);
    switch (c.id) {
      case ColumnsId.timestamp: {
        const dateText = new Date(value).toDateString();
        const timeText = new Date(value).toLocaleTimeString();
        return (
          <div>
            <div className="datetime">
              <span>{dateText}</span> <span className="text-muted">{timeText}</span>
            </div>
            <div className="netflow-table-tooltip">{`${dateText} ${timeText}`}</div>
          </div>
        );
      }
      case ColumnsId.srcpod:
      case ColumnsId.dstpod: {
        const nsValue = c.id === ColumnsId.srcpod ? flow.labels.SrcNamespace : flow.labels.DstNamespace;
        if (value && nsValue) {
          return (
            <div className="force-truncate">
              <ResourceLink
                className={size}
                inline={true}
                kind="Pod"
                name={value.toString()}
                namespace={nsValue.toString()}
              />
              <div className="netflow-table-tooltip">
                <h4>Namespace</h4>
                <span>{nsValue}</span>
                &nbsp;
                <h4>Pod</h4>
                <span>{value}</span>
              </div>
            </div>
          );
        } else {
          return '';
        }
      }
      case ColumnsId.srcwkd:
      case ColumnsId.dstwkd: {
        const nsValue = c.id === ColumnsId.srcwkd ? flow.labels.SrcNamespace : flow.labels.DstNamespace;
        const kind = c.id === ColumnsId.srcwkd ? flow.fields.SrcWorkloadKind : flow.fields.DstWorkloadKind;
        if (value && kind && nsValue) {
          return <ResourceLink kind={kind} name={value.toString()} namespace={nsValue.toString()} />;
        } else {
          return '';
        }
      }
      case ColumnsId.srcnamespace:
      case ColumnsId.dstnamespace: {
        if (value) {
          return (
            <div className="force-truncate">
              <ResourceLink className={size} inline={true} kind="Namespace" name={value.toString()} />
              <div className="netflow-table-tooltip">
                <h4>Namespace</h4>
                <span>{value}</span>
              </div>
            </div>
          );
        } else {
          return '';
        }
      }
      case ColumnsId.srcport:
      case ColumnsId.dstport: {
        return simpleTextWithTooltip(formatPort(value as number));
      }
      case ColumnsId.proto:
        if (value) {
          return simpleTextWithTooltip(formatProtocol(value as number));
        } else {
          return '';
        }
      case ColumnsId.flowdir:
        return simpleTextWithTooltip(value === FlowDirection.Ingress ? t('Ingress') : t('Egress'));
      default:
        return simpleTextWithTooltip(String(value));
    }
  };
  return (
    <Tr>
      {columns.map(c => (
        <Td key={c.id}>
          <div className={`netflow-table-content ${size}`} onMouseOver={onMouseOver}>
            {content(c)}
          </div>
        </Td>
      ))}
    </Tr>
  );
};

export default NetflowTableRow;
