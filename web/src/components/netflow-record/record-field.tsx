import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button } from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowDirection, Record } from '../../api/ipfix';
import { Column, ColumnsId } from '../../utils/columns';
import { formatPort } from '../../utils/port';
import { formatProtocol } from '../../utils/protocol';
import { Size } from '../display-dropdown';
import './record-field.css';

export type RecordFieldFilter = {
  onClick: (column: Column, isDelete: boolean) => void;
  isDelete: boolean;
};

export const RecordField: React.FC<{
  flow: Record;
  column: Column;
  size: Size;
  filter?: RecordFieldFilter;
}> = ({ flow, column, size, filter }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const onMouseOver = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (event.currentTarget) {
      const isTruncated =
        event.currentTarget.offsetHeight < event.currentTarget.scrollHeight ||
        event.currentTarget.offsetWidth < event.currentTarget.scrollWidth ||
        event.currentTarget.children[0].className === 'force-truncate';
      event.currentTarget.className = isTruncated
        ? `record-field-content truncated ${size}`
        : `record-field-content ${size}`;
    }
  };

  const simpleTextWithTooltip = (text: string) => {
    return (
      <div>
        <span>{text}</span>
        <div className="record-field-tooltip">{text}</div>
      </div>
    );
  };

  const kubeObjContent = (value: string | undefined, kind: string | undefined, ns: string | undefined) => {
    if (value && ns && kind) {
      return (
        <div className="force-truncate">
          <ResourceLink className={size} inline={true} kind={kind} name={value} namespace={ns} />
          <div className="record-field-tooltip">
            <h4>Namespace</h4>
            <span>{ns}</span>
            &nbsp;
            <h4>{kind}</h4>
            <span>{value}</span>
          </div>
        </div>
      );
    } else {
      return <div></div>;
    }
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
            <div className="record-field-tooltip">{`${dateText} ${timeText}`}</div>
          </div>
        );
      }
      case ColumnsId.srcpod:
      case ColumnsId.dstpod:
        return kubeObjContent(
          value as string,
          'Pod',
          c.id === ColumnsId.srcpod ? flow.labels.SrcNamespace : flow.labels.DstNamespace
        );
      case ColumnsId.srcwkd:
      case ColumnsId.dstwkd:
        return kubeObjContent(
          value as string,
          c.id === ColumnsId.srcwkd ? flow.fields.SrcWorkloadKind : flow.fields.DstWorkloadKind,
          c.id === ColumnsId.srcwkd ? flow.labels.SrcNamespace : flow.labels.DstNamespace
        );
      case ColumnsId.srcnamespace:
      case ColumnsId.dstnamespace: {
        if (value) {
          return (
            <div className="force-truncate">
              <ResourceLink className={size} inline={true} kind="Namespace" name={value.toString()} />
              <div className="record-field-tooltip">
                <h4>Namespace</h4>
                <span>{value}</span>
              </div>
            </div>
          );
        } else {
          return <div></div>;
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
          return <div></div>;
        }
      case ColumnsId.flowdir:
        return simpleTextWithTooltip(value === FlowDirection.Ingress ? t('Ingress') : t('Egress'));
      default:
        return simpleTextWithTooltip(String(value));
    }
  };
  return filter ? (
    <div className={`record-field-flex-container`}>
      <div className={'record-field-flex'}>{content(column)}</div>
      <Button variant="link" aria-label="Filter" onClick={() => filter.onClick(column, filter.isDelete)}>
        {filter.isDelete ? <TimesIcon /> : <FilterIcon />}
      </Button>
    </div>
  ) : (
    <div className={`record-field-content ${size}`} onMouseOver={onMouseOver}>
      {content(column)}
    </div>
  );
};

export default RecordField;
