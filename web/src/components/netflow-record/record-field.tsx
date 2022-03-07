import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Tooltip } from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowDirection, Record } from '../../api/ipfix';
import { Column, ColumnsId, getFullColumnName } from '../../utils/columns';
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
  size?: Size;
  filter?: RecordFieldFilter;
}> = ({ flow, column, size, filter }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const onMouseOver = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, className: string) => {
    if (event.currentTarget) {
      const isTruncated =
        event.currentTarget.offsetHeight < event.currentTarget.scrollHeight ||
        event.currentTarget.offsetWidth < event.currentTarget.scrollWidth ||
        event.currentTarget.children[0].className === 'force-truncate';
      event.currentTarget.className = isTruncated ? `${className} truncated ${size}` : `${className} ${size}`;
    }
  };

  const emptyText = () => {
    return <div className="record-field-flex text-muted">{t('n/a')}</div>;
  };

  const simpleTextWithTooltip = (text?: string) => {
    if (text) {
      return (
        <div>
          <span>{text}</span>
          <div className="record-field-tooltip">{text}</div>
        </div>
      );
    }
    return undefined;
  };

  const kubeObjContent = (value?: string, kind?: string, ns?: string) => {
    if (value && ns && kind) {
      return (
        <div className="force-truncate">
          <ResourceLink className={size} inline={true} kind={kind} name={value} namespace={ns} />
          <div className="record-field-tooltip">
            <h4>{t('Namespace')}</h4>
            <span>{ns}</span>
            &nbsp;
            <h4>{kind}</h4>
            <span>{value}</span>
          </div>
        </div>
      );
    }
    return undefined;
  };

  const namespaceContent = (value?: string) => {
    if (value) {
      return (
        <div className="force-truncate">
          <ResourceLink className={size} inline={true} kind="Namespace" name={value} />
          <div className="record-field-tooltip">
            <h4>{t('Namespace')}</h4>
            <span>{value}</span>
          </div>
        </div>
      );
    }
    return undefined;
  };

  const doubleContainer = (child1?: JSX.Element, child2?: JSX.Element, asChild = true) => {
    return (
      <div className={`record-field-flex-container ${asChild ? size : ''}`}>
        <div className="record-field-content-flex" onMouseOver={e => onMouseOver(e, 'record-field-content-flex')}>
          {child1 ? child1 : emptyText()}
        </div>
        <div className="record-field-content-flex" onMouseOver={e => onMouseOver(e, 'record-field-content-flex')}>
          {asChild && <span className="child-arrow">{'↪'}</span>}
          {child2 ? child2 : emptyText()}
        </div>
      </div>
    );
  };

  const singleContainer = (child?: JSX.Element) => {
    return (
      <div className={`record-field-content ${size}`} onMouseOver={e => onMouseOver(e, 'record-field-content')}>
        {child}
      </div>
    );
  };

  const ipPortContent = (value: string[], singleText = false) => {
    if (singleText) {
      return singleContainer(simpleTextWithTooltip(`${value[0]}:${value[1]}`));
    } else {
      return doubleContainer(simpleTextWithTooltip(value[0]), simpleTextWithTooltip(value[1]), false);
    }
  };

  const namespacePodContent = (value: string[]) => {
    if (value[0].includes('.')) {
      //fallback on ip:port if kubernetes objects are not resolved
      return ipPortContent(value);
    } else if (Array.isArray(value)) {
      return doubleContainer(
        namespaceContent(value[0] as string),
        kubeObjContent(value[1] as string, 'Pod', value[0] as string),
        false
      );
    } else {
      return <></>;
    }
  };

  const content = (c: Column) => {
    const value = c.value(flow);
    switch (c.id) {
      case ColumnsId.timestamp: {
        const dateText = typeof value === 'number' ? new Date(value).toDateString() : emptyText();
        const timeText = typeof value === 'number' ? new Date(value).toLocaleTimeString() : emptyText();
        return singleContainer(
          <div>
            <div className="datetime">
              <span>{dateText}</span> <span className="text-muted">{timeText}</span>
            </div>
            <div className="record-field-tooltip">{`${dateText} ${timeText}`}</div>
          </div>
        );
      }
      case ColumnsId.addrport:
        if (Array.isArray(value)) {
          return doubleContainer(
            ipPortContent([value[0], value[1]] as string[]),
            ipPortContent([value[2], value[3]] as string[])
          );
        } else {
          return <></>;
        }
      case ColumnsId.srcaddrport:
      case ColumnsId.dstaddrport:
        return ipPortContent(value as string[]);
      case ColumnsId.namespacepod:
        if (Array.isArray(value)) {
          return doubleContainer(
            namespacePodContent([value[0], value[1]] as string[]),
            namespacePodContent([value[2], value[3]] as string[])
          );
        } else {
          return <></>;
        }
      case ColumnsId.srcnamespacepod:
      case ColumnsId.dstnamespacepod:
        return namespacePodContent(value as string[]);
      case ColumnsId.pod:
        return Array.isArray(value) ? (
          doubleContainer(
            kubeObjContent(value[0] as string, 'Pod', flow.labels.SrcNamespace),
            kubeObjContent(value[1] as string, 'Pod', flow.labels.DstNamespace)
          )
        ) : (
          <></>
        );
      case ColumnsId.srcpod:
      case ColumnsId.dstpod:
        return singleContainer(
          kubeObjContent(
            value as string,
            'Pod',
            c.id === ColumnsId.srcpod ? flow.labels.SrcNamespace : flow.labels.DstNamespace
          )
        );
      case ColumnsId.wkd:
        return Array.isArray(value) ? (
          doubleContainer(
            kubeObjContent(value[0] as string, flow.fields.SrcWorkloadKind, flow.labels.SrcNamespace),
            kubeObjContent(value[1] as string, flow.fields.DstWorkloadKind, flow.labels.DstNamespace)
          )
        ) : (
          <></>
        );
      case ColumnsId.srcwkd:
      case ColumnsId.dstwkd:
        return singleContainer(
          kubeObjContent(
            value as string,
            c.id === ColumnsId.srcwkd ? flow.fields.SrcWorkloadKind : flow.fields.DstWorkloadKind,
            c.id === ColumnsId.srcwkd ? flow.labels.SrcNamespace : flow.labels.DstNamespace
          )
        );
      case ColumnsId.namespace:
        return Array.isArray(value) ? (
          doubleContainer(namespaceContent(value[0] as string), namespaceContent(value[1] as string))
        ) : (
          <></>
        );
      case ColumnsId.srcnamespace:
      case ColumnsId.dstnamespace: {
        return singleContainer(namespaceContent(value as string));
      }
      case ColumnsId.port:
        return Array.isArray(value) ? (
          doubleContainer(
            simpleTextWithTooltip(value[0] ? formatPort(Number(value[0])) : ''),
            simpleTextWithTooltip(value[1] ? formatPort(Number(value[1])) : '')
          )
        ) : (
          <></>
        );
      case ColumnsId.srcport:
      case ColumnsId.dstport: {
        return singleContainer(simpleTextWithTooltip(value ? formatPort(value as number) : ''));
      }
      case ColumnsId.proto:
        return singleContainer(simpleTextWithTooltip(value ? formatProtocol(value as number) : ''));
      case ColumnsId.flowdir:
        return singleContainer(simpleTextWithTooltip(value === FlowDirection.Ingress ? t('Ingress') : t('Egress')));
      default:
        if (Array.isArray(value) && value.length) {
          return doubleContainer(simpleTextWithTooltip(String(value[0])), simpleTextWithTooltip(String(value[1])));
        } else {
          return singleContainer(simpleTextWithTooltip(String(value)));
        }
    }
  };
  return filter ? (
    <div className={`record-field-flex-container`}>
      <div className={'record-field-flex'}>{content(column)}</div>
      <Tooltip
        content={
          filter.isDelete
            ? t('Remove {{name}} filter', { name: getFullColumnName(column) })
            : t('Filter on {{name}}', { name: getFullColumnName(column) })
        }
      >
        <Button variant="link" aria-label="Filter" onClick={() => filter.onClick(column, filter.isDelete)}>
          {filter.isDelete ? <TimesIcon /> : <FilterIcon />}
        </Button>
      </Tooltip>
    </div>
  ) : (
    content(column)
  );
};

export default RecordField;
