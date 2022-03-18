import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Tooltip } from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowDirection, Record } from '../../api/ipfix';
import { Column, ColumnsId, getFullColumnName } from '../../utils/columns';
import { formatPort } from '../../utils/port';
import { formatProtocol } from '../../utils/protocol';
import { Size } from '../dropdowns/display-dropdown';
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

  const kubeObjContent = (value: string | undefined, kind: string | undefined, ns: string | undefined) => {
    // Note: namespace is not mandatory here (e.g. Node objects)
    if (value && kind) {
      return (
        <div className="force-truncate">
          <ResourceLink className={size} inline={true} kind={kind} name={value} namespace={ns} />
          <div className="record-field-tooltip">
            {ns && (
              <>
                <h4>{t('Namespace')}</h4>
                <span>{ns}</span>
                &nbsp;
              </>
            )}
            <h4>{kind}</h4>
            <span>{value}</span>
          </div>
        </div>
      );
    }
    return undefined;
  };

  const explicitKubeObjContent = (ip: string, port: number, kind?: string, namespace?: string, name?: string) => {
    // Note: namespace is not mandatory here (e.g. Node objects)
    if (name && kind) {
      return doubleContainer(kubeObjContent(name, kind, namespace), namespaceContent(namespace), false);
    } else {
      return ipPortContent(ip, port);
    }
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

  const ipPortContent = (ip: string, port: number, singleText = false) => {
    if (singleText) {
      return singleContainer(simpleTextWithTooltip(port ? `${ip}:${String(port)}` : ip));
    } else {
      return doubleContainer(simpleTextWithTooltip(ip), simpleTextWithTooltip(port ? String(port) : undefined), false);
    }
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
        {child ? child : emptyText()}
      </div>
    );
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
      case ColumnsId.name:
        return doubleContainer(
          kubeObjContent(flow.fields.SrcK8S_Name, flow.fields.SrcK8S_Type, flow.labels.SrcK8S_Namespace),
          kubeObjContent(flow.fields.DstK8S_Name, flow.fields.DstK8S_Type, flow.labels.DstK8S_Namespace)
        );
      case ColumnsId.srcname:
        return singleContainer(kubeObjContent(value as string, flow.fields.SrcK8S_Type, flow.labels.SrcK8S_Namespace));
      case ColumnsId.dstname:
        return singleContainer(kubeObjContent(value as string, flow.fields.DstK8S_Type, flow.labels.DstK8S_Namespace));
      case ColumnsId.owner:
        return doubleContainer(
          kubeObjContent(flow.labels.SrcK8S_OwnerName, flow.fields.SrcK8S_OwnerType, flow.labels.SrcK8S_Namespace),
          kubeObjContent(flow.labels.DstK8S_OwnerName, flow.fields.DstK8S_OwnerType, flow.labels.DstK8S_Namespace)
        );
      case ColumnsId.srcowner:
        return singleContainer(
          kubeObjContent(value as string, flow.fields.SrcK8S_OwnerType, flow.labels.SrcK8S_Namespace)
        );
      case ColumnsId.dstowner:
        return singleContainer(
          kubeObjContent(value as string, flow.fields.DstK8S_OwnerType, flow.labels.DstK8S_Namespace)
        );
      case ColumnsId.addrport:
        return doubleContainer(
          ipPortContent(flow.fields.SrcAddr, flow.fields.SrcPort),
          ipPortContent(flow.fields.DstAddr, flow.fields.DstPort)
        );
      case ColumnsId.srcaddrport:
        return singleContainer(ipPortContent(flow.fields.SrcAddr, flow.fields.SrcPort));
      case ColumnsId.dstaddrport:
        return singleContainer(ipPortContent(flow.fields.DstAddr, flow.fields.DstPort));
      case ColumnsId.kubeobject:
        return doubleContainer(
          explicitKubeObjContent(
            flow.fields.SrcAddr,
            flow.fields.SrcPort,
            flow.fields.SrcK8S_Type,
            flow.labels.SrcK8S_Namespace,
            flow.fields.SrcK8S_Name
          ),
          explicitKubeObjContent(
            flow.fields.DstAddr,
            flow.fields.DstPort,
            flow.fields.DstK8S_Type,
            flow.labels.DstK8S_Namespace,
            flow.fields.DstK8S_Name
          )
        );
      case ColumnsId.srckubeobject:
        return singleContainer(
          explicitKubeObjContent(
            flow.fields.SrcAddr,
            flow.fields.SrcPort,
            flow.fields.SrcK8S_Type,
            flow.labels.SrcK8S_Namespace,
            flow.fields.SrcK8S_Name
          )
        );
      case ColumnsId.dstkubeobject:
        return singleContainer(
          explicitKubeObjContent(
            flow.fields.DstAddr,
            flow.fields.DstPort,
            flow.fields.DstK8S_Type,
            flow.labels.DstK8S_Namespace,
            flow.fields.DstK8S_Name
          )
        );
      case ColumnsId.ownerkubeobject:
        return doubleContainer(
          explicitKubeObjContent(
            flow.fields.SrcAddr,
            flow.fields.SrcPort,
            flow.fields.SrcK8S_OwnerType,
            flow.labels.SrcK8S_Namespace,
            flow.labels.SrcK8S_OwnerName
          ),
          explicitKubeObjContent(
            flow.fields.DstAddr,
            flow.fields.DstPort,
            flow.fields.DstK8S_OwnerType,
            flow.labels.DstK8S_Namespace,
            flow.labels.DstK8S_OwnerName
          )
        );
      case ColumnsId.srcownerkubeobject:
        return singleContainer(
          explicitKubeObjContent(
            flow.fields.SrcAddr,
            flow.fields.SrcPort,
            flow.fields.SrcK8S_OwnerType,
            flow.labels.SrcK8S_Namespace,
            flow.labels.DstK8S_OwnerName
          )
        );
      case ColumnsId.dstownerkubeobject:
        return singleContainer(
          explicitKubeObjContent(
            flow.fields.DstAddr,
            flow.fields.DstPort,
            flow.fields.DstK8S_OwnerType,
            flow.labels.DstK8S_Namespace,
            flow.labels.DstK8S_OwnerName
          )
        );
      case ColumnsId.namespace:
        return doubleContainer(
          namespaceContent(flow.labels.SrcK8S_Namespace),
          namespaceContent(flow.labels.DstK8S_Namespace)
        );
      case ColumnsId.srcnamespace:
      case ColumnsId.dstnamespace: {
        return singleContainer(namespaceContent(value as string));
      }
      case ColumnsId.port:
        return doubleContainer(
          simpleTextWithTooltip(flow.fields.SrcPort ? formatPort(flow.fields.SrcPort) : ''),
          simpleTextWithTooltip(flow.fields.DstPort ? formatPort(flow.fields.DstPort) : '')
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
