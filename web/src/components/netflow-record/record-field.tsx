import { ResourceIcon, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Tooltip } from '@patternfly/react-core';
import { FilterIcon, ToggleOnIcon, ToggleOffIcon, GlobeAmericasIcon, TimesIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowDirection, Record } from '../../api/ipfix';
import { Column, ColumnsId, getFullColumnName } from '../../utils/columns';
import { dateFormatter, getFormattedDate, timeMSFormatter, utcDateTimeFormatter } from '../../utils/datetime';
import { formatDurationAboveMillisecond } from '../../utils/duration';
import { formatPort } from '../../utils/port';
import { formatProtocol } from '../../utils/protocol';
import { getCode, getType } from '../../utils/icmp';
import { Size } from '../dropdowns/table-display-dropdown';
import './record-field.css';

export type RecordFieldFilter = {
  type: 'filter' | 'switch';
  onClick: () => void;
  isDelete: boolean;
};

export const RecordField: React.FC<{
  flow: Record;
  column: Column;
  size?: Size;
  useLinks: boolean;
  filter?: RecordFieldFilter;
  detailed?: boolean;
  isDark?: boolean;
}> = ({ flow, column, size, filter, useLinks, detailed, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

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

  const simpleTextWithTooltip = (text?: string, color?: string) => {
    if (text) {
      return (
        <div data-test={`field-text-${text}`}>
          <span style={{ color }}>{text}</span>
          <div className="record-field-tooltip">{text}</div>
        </div>
      );
    }
    return undefined;
  };

  const resourceIconText = (value: string, kind: string, ns?: string) => {
    return (
      //force ResourceLink when ResourceIcon is not defined (ie OCP < 4.12)
      !ResourceIcon || useLinks ? (
        <ResourceLink className={size} inline={true} kind={kind} name={value} namespace={ns} />
      ) : (
        <span className={`co-resource-item ${size}`}>
          <ResourceIcon kind={kind} />
          <span className="co-resource-item__resource-name" data-test-id={value}>
            {value}
          </span>
        </span>
      )
    );
  };

  const kubeObjContent = (value: string | undefined, kind: string | undefined, ns: string | undefined) => {
    // Note: namespace is not mandatory here (e.g. Node objects)
    if (value && kind) {
      return (
        <div data-test={`field-resource-${kind}.${ns}.${value}`} className="force-truncate">
          {resourceIconText(value, kind, ns)}
          <div className="record-field-tooltip">
            {ns && (
              <>
                <h4>{t('Namespace')}</h4>
                <span>{ns}</span>
              </>
            )}
            <h4 className="record-field-tooltip-margin">{kind}</h4>
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
      return doubleContainer(kubeObjContent(name, kind, namespace), kindContent('Namespace', namespace), false);
    } else {
      return ipPortContent(ip, port);
    }
  };

  const kindContent = (kind: 'Namespace' | 'Node', value?: string) => {
    if (value) {
      return (
        <div data-test={`field-kind-${kind}.${value}`} className="force-truncate">
          {resourceIconText(value, kind)}
          <div className="record-field-tooltip">
            <h4>{t(kind)}</h4>
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

  const dateTimeContent = (date: Date | undefined) => {
    if (!date) {
      return emptyText();
    }

    const fullDateText = getFormattedDate(date, utcDateTimeFormatter);
    const dateText = getFormattedDate(date, dateFormatter) + ',';
    const timeText = getFormattedDate(date, timeMSFormatter);
    return singleContainer(
      <div data-test={`field-date-${dateText}-${timeText}`} className="record-field-date">
        <GlobeAmericasIcon className="record-field-date-icon" />
        <Tooltip
          content={[
            <span className="co-nowrap" key="co-timestamp">
              {fullDateText}
            </span>
          ]}
        >
          <div className={`datetime ${size}`}>
            <span>{dateText}</span> <span className="text-muted">{timeText}</span>
          </div>
        </Tooltip>
      </div>
    );
  };

  const doubleContainer = (child1?: JSX.Element, child2?: JSX.Element, asChild = true, childIcon = true) => {
    return (
      <div className={`record-field-flex-container ${asChild ? size : ''}`}>
        <div className="record-field-content-flex" onMouseOver={e => onMouseOver(e, 'record-field-content-flex')}>
          {child1 ? child1 : emptyText()}
        </div>
        <div className="record-field-content-flex" onMouseOver={e => onMouseOver(e, 'record-field-content-flex')}>
          {asChild && childIcon && <span className="child-arrow">{'↪'}</span>}
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
      case ColumnsId.collectiontime:
      case ColumnsId.starttime:
      case ColumnsId.endtime:
      case ColumnsId.dnsrequesttime:
      case ColumnsId.dnsresponsetime:
        return dateTimeContent(typeof value === 'number' && !isNaN(value) ? new Date(value) : undefined);
      case ColumnsId.collectionlatency:
      case ColumnsId.dnslatency:
      case ColumnsId.duration:
        return singleContainer(
          typeof value === 'number' && !isNaN(value)
            ? simpleTextWithTooltip(formatDurationAboveMillisecond(value as number))
            : undefined
        );
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
          kindContent('Namespace', flow.labels.SrcK8S_Namespace),
          kindContent('Namespace', flow.labels.DstK8S_Namespace)
        );
      case ColumnsId.srcnamespace:
      case ColumnsId.dstnamespace: {
        return singleContainer(kindContent('Namespace', value as string));
      }
      case ColumnsId.hostname:
        return doubleContainer(
          kindContent('Node', flow.fields.SrcK8S_HostName),
          kindContent('Node', flow.fields.DstK8S_HostName)
        );
      case ColumnsId.srchostname:
      case ColumnsId.dsthostname: {
        return singleContainer(kindContent('Node', value as string));
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
        return singleContainer(
          simpleTextWithTooltip(
            value === FlowDirection.Ingress ? t('Ingress') : value === FlowDirection.Egress ? t('Egress') : t('n/a')
          )
        );
      case ColumnsId.packets:
      case ColumnsId.bytes:
        if (Array.isArray(value) && value.length) {
          let sentText = t('sent');
          let droppedText = t('dropped');
          if (c.id === ColumnsId.bytes) {
            if (flow.fields.IcmpType) {
              sentText = t('sent reporting {{type}} {{code}}', {
                type: getType(flow.fields.IcmpType),
                code: getCode(flow.fields.IcmpType, flow.fields.IcmpCode)
              });
            }

            if (flow.fields.TcpDropCause) {
              droppedText = t('dropped by {{reason}}', { reason: flow.fields.TcpDropCause });
            }
          }
          return doubleContainer(
            simpleTextWithTooltip(
              detailed ? `${String(value[0])} ${c.name.toLowerCase()} ${sentText}` : String(value[0]),
              isDark ? '#3E8635' : '#1E4F18'
            ),
            simpleTextWithTooltip(
              detailed ? `${String(value[1])} ${c.name.toLowerCase()} ${droppedText}` : String(value[1]),
              isDark ? '#C9190B' : '#A30000'
            ),
            true,
            false
          );
        } else {
          return singleContainer(
            simpleTextWithTooltip(
              detailed ? `${String(value)} ${c.name.toLowerCase()} ${t('sent')}` : String(value),
              isDark ? '#3E8635' : '#1E4F18'
            )
          );
        }
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
          filter.type === 'filter'
            ? filter.isDelete
              ? t('Remove {{name}} filter', { name: getFullColumnName(column) })
              : t('Filter on {{name}}', { name: getFullColumnName(column) })
            : t('Switch {{name}} option', { name: getFullColumnName(column) })
        }
      >
        <Button variant="link" aria-label="Filter" onClick={filter.onClick}>
          {filter.type === 'filter' ? (
            filter.isDelete ? (
              <TimesIcon />
            ) : (
              <FilterIcon />
            )
          ) : filter.isDelete ? (
            <ToggleOffIcon />
          ) : (
            <ToggleOnIcon />
          )}
        </Button>
      </Tooltip>
    </div>
  ) : (
    content(column)
  );
};

export default RecordField;
