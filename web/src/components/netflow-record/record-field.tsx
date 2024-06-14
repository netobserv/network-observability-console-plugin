import { ResourceIcon, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Flex, FlexItem, Popover, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { FilterIcon, GlobeAmericasIcon, TimesIcon, ToggleOffIcon, ToggleOnIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FlowDirection, getDirectionDisplayString, Record } from '../../api/ipfix';
import { Column, ColumnsId, getFullColumnName } from '../../utils/columns';
import { dateFormatter, getFormattedDate, timeMSFormatter, utcDateTimeFormatter } from '../../utils/datetime';
import { dnsCodesNames, dnsErrorsValues, getDNSErrorDescription, getDNSRcodeDescription } from '../../utils/dns';
import { getDSCPDocUrl, getDSCPServiceClassDescription, getDSCPServiceClassName } from '../../utils/dscp';
import { formatDurationAboveMillisecond, formatDurationAboveNanosecond } from '../../utils/duration';
import {
  getICMPCode,
  getICMPDocUrl,
  getICMPType,
  icmpAllCodesValues,
  icmpAllTypesValues,
  isValidICMPProto
} from '../../utils/icmp';
import { dropCausesNames, getDropCauseDescription, getDropCauseDocUrl } from '../../utils/pkt-drop';
import { formatPort } from '../../utils/port';
import { formatProtocol, getProtocolDocUrl } from '../../utils/protocol';
import { Size } from '../dropdowns/table-display-dropdown';
import './record-field.css';

export type RecordFieldFilter = {
  type: 'filter' | 'switch';
  onClick: () => void;
  isDelete: boolean;
};

export const RecordField: React.FC<{
  allowPktDrops: boolean;
  flow: Record;
  column: Column;
  size?: Size;
  useLinks: boolean;
  filter?: RecordFieldFilter;
  detailed?: boolean;
  isDark?: boolean;
}> = ({ allowPktDrops, flow, column, size, filter, useLinks, detailed, isDark }) => {
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

  const errorTextValue = (value: string, text: string) => {
    return (
      <div className="record-field-flex">
        <Tooltip
          content={[
            <span className="co-nowrap" key="co-error-text">
              {text}
            </span>
          ]}
        >
          <div style={{ color: isDark ? '#C9190B' : '#A30000' }} className="record-field-flex">
            {value}
          </div>
        </Tooltip>
      </div>
    );
  };

  const emptyText = (errorText?: string) => {
    if (errorText) {
      return errorTextValue(t('n/a'), errorText);
    }
    return <div className="record-field-flex text-muted">{t('n/a')}</div>;
  };

  const emptyDnsErrorText = () => {
    return emptyText(
      flow.fields.DnsErrno
        ? `${t('DNS Error')} ${flow.fields.DnsErrno}: ${getDNSErrorDescription(
          flow.fields.DnsErrno as dnsErrorsValues
        )}`
        : undefined
    );
  };

  const simpleTextWithTooltip = (text?: string, color?: string, child?: JSX.Element) => {
    if (text) {
      return (
        <div data-test={`field-text-${text}`}>
          <span style={{ color }}>{text}</span>
          <div className="record-field-tooltip">{text}</div>
          {child}
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
      return singleContainer(simpleTextWithTooltip(port && !Number.isNaN(port) ? `${ip}:${String(port)}` : ip));
    } else {
      return doubleContainer(
        simpleTextWithTooltip(ip),
        simpleTextWithTooltip(port && !Number.isNaN(port) ? String(port) : undefined),
        false
      );
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
      <Flex data-test={`field-date-${dateText}-${timeText}`} className="record-field-date">
        <FlexItem><GlobeAmericasIcon className="record-field-date-icon" /></FlexItem>
        <FlexItem>
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
        </FlexItem>
      </Flex>
    );
  };

  const nthContainer = (children: (JSX.Element | undefined)[], asChild = true, childIcon = true) => {
    return (
      <Flex className={`record-field-flex-container ${asChild ? size : ''}`} flex={{ default: "flex_1" }}>
        {children.map((c, i) => (
          <FlexItem
            key={i}
            className={`record-field-content`}
            onMouseOver={e => onMouseOver(e, `record-field-content`)}
            flex={{ default: "flex_1" }}
          >
            {i > 0 && asChild && childIcon && <span className="child-arrow">{'↪'}</span>}
            {c ? c : emptyText()}
          </FlexItem>
        ))}
      </Flex>
    );
  };

  const doubleContainer = (child1?: JSX.Element, child2?: JSX.Element, asChild = true, childIcon = true) => {
    return nthContainer([child1, child2], asChild, childIcon);
  };

  const sideBySideContainer = (leftElement?: JSX.Element, rightElement?: JSX.Element) => {
    return (
      <Flex direction={{ default: 'row' }} flex={{ default: 'flex_1' }}>
        <FlexItem flex={{ default: 'flex_1' }}>{leftElement || emptyText()}</FlexItem>
        <FlexItem flex={{ default: 'flex_1' }}>{rightElement || emptyText()}</FlexItem>
      </Flex>
    );
  };

  const singleContainer = (child?: JSX.Element) => {
    return (
      <div className={`record-field-content ${size}`} onMouseOver={e => onMouseOver(e, 'record-field-content')}>
        {child ? child : emptyText()}
      </div>
    );
  };

  const clickableContent = (text: string, content: string, docUrl?: string) => {
    return (
      <Popover
        headerContent={text}
        bodyContent={content}
        footerContent={
          docUrl ? (
            <Button
              variant="link"
              component={(props: React.FunctionComponent) => (
                <Link {...props} target="_blank" to={{ pathname: docUrl }} />
              )}
            >
              {t('Show related documentation')}
            </Button>
          ) : undefined
        }
      >
        <Button variant="plain" className="record-field-value-popover-button">
          <Text component={TextVariants.h4}>{text}</Text>
        </Button>
      </Popover>
    );
  };

  const content = (c: Column) => {
    const value = c.value(flow);
    switch (c.id) {
      case ColumnsId.collectiontime:
      case ColumnsId.starttime:
      case ColumnsId.endtime:
        return dateTimeContent(typeof value === 'number' && !isNaN(value) ? new Date(value) : undefined);
      case ColumnsId.collectionlatency:
      case ColumnsId.duration:
      case ColumnsId.rttTime:
        return singleContainer(
          typeof value === 'number' && !isNaN(value)
            ? simpleTextWithTooltip(
              c.id === ColumnsId.rttTime
                ? formatDurationAboveNanosecond(value as number)
                : formatDurationAboveMillisecond(value as number)
            )
            : undefined
        );
      case ColumnsId.name:
        return doubleContainer(
          kubeObjContent(flow.fields.SrcK8S_Name, flow.labels.SrcK8S_Type, flow.labels.SrcK8S_Namespace),
          kubeObjContent(flow.fields.DstK8S_Name, flow.labels.DstK8S_Type, flow.labels.DstK8S_Namespace)
        );
      case ColumnsId.srcname:
        return singleContainer(kubeObjContent(value as string, flow.labels.SrcK8S_Type, flow.labels.SrcK8S_Namespace));
      case ColumnsId.dstname:
        return singleContainer(kubeObjContent(value as string, flow.labels.DstK8S_Type, flow.labels.DstK8S_Namespace));
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
          ipPortContent(flow.fields.SrcAddr || '', flow.fields.SrcPort || NaN),
          ipPortContent(flow.fields.DstAddr || '', flow.fields.DstPort || NaN)
        );
      case ColumnsId.srcaddrport:
        return singleContainer(ipPortContent(flow.fields.SrcAddr || '', flow.fields.SrcPort || NaN));
      case ColumnsId.dstaddrport:
        return singleContainer(ipPortContent(flow.fields.DstAddr || '', flow.fields.DstPort || NaN));
      case ColumnsId.kubeobject:
        return doubleContainer(
          explicitKubeObjContent(
            flow.fields.SrcAddr || '',
            flow.fields.SrcPort || NaN,
            flow.labels.SrcK8S_Type,
            flow.labels.SrcK8S_Namespace,
            flow.fields.SrcK8S_Name
          ),
          explicitKubeObjContent(
            flow.fields.DstAddr || '',
            flow.fields.DstPort || NaN,
            flow.labels.DstK8S_Type,
            flow.labels.DstK8S_Namespace,
            flow.fields.DstK8S_Name
          )
        );
      case ColumnsId.srckubeobject:
        return singleContainer(
          explicitKubeObjContent(
            flow.fields.SrcAddr || '',
            flow.fields.SrcPort || NaN,
            flow.labels.SrcK8S_Type,
            flow.labels.SrcK8S_Namespace,
            flow.fields.SrcK8S_Name
          )
        );
      case ColumnsId.dstkubeobject:
        return singleContainer(
          explicitKubeObjContent(
            flow.fields.DstAddr || '',
            flow.fields.DstPort || NaN,
            flow.labels.DstK8S_Type,
            flow.labels.DstK8S_Namespace,
            flow.fields.DstK8S_Name
          )
        );
      case ColumnsId.ownerkubeobject:
        return doubleContainer(
          explicitKubeObjContent(
            flow.fields.SrcAddr || '',
            flow.fields.SrcPort || NaN,
            flow.fields.SrcK8S_OwnerType,
            flow.labels.SrcK8S_Namespace,
            flow.labels.SrcK8S_OwnerName
          ),
          explicitKubeObjContent(
            flow.fields.DstAddr || '',
            flow.fields.DstPort || NaN,
            flow.fields.DstK8S_OwnerType,
            flow.labels.DstK8S_Namespace,
            flow.labels.DstK8S_OwnerName
          )
        );
      case ColumnsId.srcownerkubeobject:
        return singleContainer(
          explicitKubeObjContent(
            flow.fields.SrcAddr || '',
            flow.fields.SrcPort || NaN,
            flow.fields.SrcK8S_OwnerType,
            flow.labels.SrcK8S_Namespace,
            flow.labels.DstK8S_OwnerName
          )
        );
      case ColumnsId.dstownerkubeobject:
        return singleContainer(
          explicitKubeObjContent(
            flow.fields.DstAddr || '',
            flow.fields.DstPort || NaN,
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
      case ColumnsId.proto: {
        if (typeof value === 'number' && !isNaN(value)) {
          const docUrl = getProtocolDocUrl();
          const protocolName = formatProtocol(value as number, t);
          return singleContainer(
            detailed
              ? clickableContent(protocolName, `${t('Value')}: ${value}`, docUrl)
              : simpleTextWithTooltip(protocolName)
          );
        } else {
          return singleContainer(emptyText());
        }
      }
      case ColumnsId.dscp: {
        let child = emptyText();
        if (typeof value === 'number' && !isNaN(value)) {
          const serviceClassName = getDSCPServiceClassName(value);
          if (serviceClassName && detailed) {
            child = clickableContent(
              serviceClassName,
              `${t('Value')}: ${value} ${t('Examples')}: ${getDSCPServiceClassDescription(value)}`,
              getDSCPDocUrl()
            );
          } else {
            child = simpleTextWithTooltip(serviceClassName || String(value))!;
          }
        }
        return singleContainer(child);
      }
      case ColumnsId.icmptype: {
        let child = emptyText();
        if (Array.isArray(value) && value.length) {
          if (isValidICMPProto(Number(value[0]))) {
            const type = getICMPType(Number(value[0]), Number(value[1]) as icmpAllTypesValues);
            if (type && detailed) {
              child = clickableContent(type.name, type.description || '', getICMPDocUrl(Number(value[0])));
            } else {
              child = simpleTextWithTooltip(type?.name || String(value[1]))!;
            }
          } else {
            child = errorTextValue(
              String(value[1]),
              t('ICMP type provided but protocol is {{proto}}', { proto: formatProtocol(value[0] as number, t) })
            );
          }
        }
        return singleContainer(child);
      }
      case ColumnsId.icmpcode: {
        let child = emptyText();
        if (Array.isArray(value) && value.length) {
          if (isValidICMPProto(Number(value[0]))) {
            const code = getICMPCode(
              Number(value[0]),
              Number(value[1]) as icmpAllTypesValues,
              Number(value[2]) as icmpAllCodesValues
            );
            if (code && detailed) {
              child = clickableContent(code.name, code.description || '', getICMPDocUrl(Number(value[0])));
            } else {
              child = simpleTextWithTooltip(code?.name || String(value[2]))!;
            }
          } else {
            child = errorTextValue(
              String(value[1]),
              t('ICMP code provided but protocol is {{proto}}', { proto: formatProtocol(value[0] as number, t) })
            );
          }
        }
        return singleContainer(child);
      }
      case ColumnsId.nodedir:
      case ColumnsId.ifdirs: {
        if (Array.isArray(value)) {
          return nthContainer(
            value.map(dir => simpleTextWithTooltip(getDirectionDisplayString(String(dir) as FlowDirection, t))),
            true,
            false
          );
        }
        return singleContainer(simpleTextWithTooltip(getDirectionDisplayString(String(value) as FlowDirection, t)));
      }
      case ColumnsId.interfaces: {
        if (Array.isArray(value)) {
          return nthContainer(
            value.map(iName => simpleTextWithTooltip(String(iName))),
            true,
            false
          );
        }
        return singleContainer(simpleTextWithTooltip(String(value)));
      }
      case ColumnsId.flowdirints: {
        if (
          flow.fields.Interfaces &&
          flow.fields.IfDirections &&
          Array.isArray(flow.fields.Interfaces) &&
          Array.isArray(flow.fields.IfDirections) &&
          flow.fields.Interfaces.length === flow.fields.IfDirections.length
        ) {
          return nthContainer(
            flow.fields.Interfaces.map((iName, i) =>
              sideBySideContainer(
                simpleTextWithTooltip(iName),
                simpleTextWithTooltip(
                  getDirectionDisplayString(String(flow.fields.IfDirections![i]) as FlowDirection, t)
                )
              )
            ),
            true,
            false
          );
        } else {
          return singleContainer(emptyText(t('Invalid data provided. Check JSON for details.')));
        }
      }
      case ColumnsId.packets:
      case ColumnsId.bytes:
        //show both sent / dropped counts
        if (Array.isArray(value)) {
          let droppedText = t('dropped');
          let child: JSX.Element | undefined = undefined;
          if (detailed && c.id === ColumnsId.packets && flow.fields.PktDropLatestDropCause) {
            droppedText = t('dropped by');
            child = clickableContent(
              flow.fields.PktDropLatestDropCause,
              getDropCauseDescription(flow.fields.PktDropLatestDropCause as dropCausesNames),
              getDropCauseDocUrl(flow.fields.PktDropLatestDropCause as dropCausesNames)
            );
          }

          const sentCount = value.length >= 1 && value[0] ? String(value[0]) : String(0);
          const droppedCount = allowPktDrops && value.length >= 2 && value[1] ? String(value[1]) : undefined;
          return doubleContainer(
            simpleTextWithTooltip(
              detailed ? `${sentCount} ${c.name.toLowerCase()} ${t('sent')}` : sentCount,
              allowPktDrops ? (isDark ? '#3E8635' : '#1E4F18') : undefined
            ),
            droppedCount ? (
              simpleTextWithTooltip(
                detailed ? `${droppedCount} ${c.name.toLowerCase()} ${droppedText}` : droppedCount,
                isDark ? '#C9190B' : '#A30000',
                child
              )
            ) : (
              <></>
            ),
            true,
            false
          );
        } else {
          return singleContainer(
            simpleTextWithTooltip(detailed ? `${String(value)} ${c.name.toLowerCase()} ${t('sent')}` : String(value))
          );
        }
      case ColumnsId.dnsid: {
        return singleContainer(
          typeof value === 'number' && !isNaN(value) ? simpleTextWithTooltip(String(value)) : emptyDnsErrorText()
        );
      }
      case ColumnsId.dnslatency: {
        return singleContainer(
          typeof value === 'number' && !isNaN(value)
            ? simpleTextWithTooltip(formatDurationAboveMillisecond(value as number))
            : emptyDnsErrorText()
        );
      }
      case ColumnsId.dnsresponsecode: {
        return singleContainer(
          typeof value === 'string' && value.length
            ? simpleTextWithTooltip(detailed ? `${value}: ${getDNSRcodeDescription(value as dnsCodesNames)}` : value)
            : emptyDnsErrorText()
        );
      }
      case ColumnsId.dnserrno: {
        return singleContainer(
          typeof value === 'number' && !isNaN(value)
            ? simpleTextWithTooltip(
              detailed && value ? `${value}: ${getDNSErrorDescription(value as dnsErrorsValues)}` : String(value)
            )
            : emptyText()
        );
      }
      default:
        if (Array.isArray(value) && value.length) {
          // we can only show two values properly with containers
          if (value.length === 2) {
            return doubleContainer(simpleTextWithTooltip(String(value[0])), simpleTextWithTooltip(String(value[1])));
          }
          // else we will show values as single joigned string
          return singleContainer(simpleTextWithTooltip(value.map(v => String(v)).join(', ')));
        } else {
          return singleContainer(simpleTextWithTooltip(String(value)));
        }
    }
  };
  return filter ? (
    <Flex className={`record-field-flex-container`} flex={{ default: "flex_1" }}>
      <FlexItem className={'record-field-flex'} flex={{ default: "flex_1" }}>{content(column)}</FlexItem>
      <FlexItem>
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
      </FlexItem>
    </Flex>
  ) : (
    content(column)
  );
};

export default RecordField;
