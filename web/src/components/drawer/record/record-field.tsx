import { ResourceIcon, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Flex, FlexItem, Popover, Text, TextContent, TextVariants, Tooltip } from '@patternfly/react-core';
import { FilterIcon, GlobeAmericasIcon, TimesIcon, ToggleOffIcon, ToggleOnIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FlowDirection, getDirectionDisplayString, Record } from '../../../api/ipfix';
import { Column, ColumnsId, getFullColumnName, isKubeObj, KubeObj } from '../../../utils/columns';
import { dateFormatter, getFormattedDate, timeMSFormatter, utcDateTimeFormatter } from '../../../utils/datetime';
import { dnsCodesNames, dnsErrorsValues, getDNSErrorDescription, getDNSRcodeDescription } from '../../../utils/dns';
import { getDSCPDocUrl, getDSCPServiceClassDescription, getDSCPServiceClassName } from '../../../utils/dscp';
import { formatDurationAboveMillisecond, formatDurationAboveNanosecond } from '../../../utils/duration';
import { getICMPCode, getICMPDocUrl, getICMPType, icmpAllTypesValues, isValidICMPProto } from '../../../utils/icmp';
import { dropCausesNames, getDropCauseDescription, getDropCauseDocUrl } from '../../../utils/pkt-drop';
import { formatPort } from '../../../utils/port';
import { formatProtocol, getProtocolDocUrl } from '../../../utils/protocol';
import { decomposeTCPFlagsBitfield, getTCPFlagsDocUrl } from '../../../utils/tcp-flags';
import { Size } from '../../dropdowns/table-display-dropdown';
import './record-field.css';

export type RecordFieldFilter = {
  type: 'filter' | 'switch';
  onClick: () => void;
  isDelete: boolean;
};

export interface RecordFieldProps {
  allowPktDrops: boolean;
  flow: Record;
  column: Column;
  size?: Size;
  useLinks: boolean;
  filter?: RecordFieldFilter;
  detailed?: boolean;
  isDark?: boolean;
}

export const RecordField: React.FC<RecordFieldProps> = ({
  allowPktDrops,
  flow,
  column,
  size,
  filter,
  useLinks,
  detailed,
  isDark
}) => {
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
            <Text component={TextVariants.p} className="record-field-value co-nowrap" key="co-error-text">
              {text}
            </Text>
          ]}
        >
          <Text
            component={TextVariants.p}
            style={{ color: isDark ? '#C9190B' : '#A30000' }}
            className="record-field-flex"
          >
            {value}
          </Text>
        </Tooltip>
      </div>
    );
  };

  const emptyText = (errorText?: string) => {
    if (errorText) {
      return errorTextValue(t('n/a'), errorText);
    }
    return <Text className="record-field-flex text-muted record-field-value">{t('n/a')}</Text>;
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
        <TextContent className="netobserv-no-child-margin" data-test={`field-text-${text}`}>
          <Text className="record-field-value" component={TextVariants.p} style={{ color }}>
            {text}
          </Text>
          <Text component={TextVariants.p} className="record-field-tooltip">
            {text}
          </Text>
          {child}
        </TextContent>
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
        <TextContent className={`co-resource-item ${size} netobserv-no-child-margin`}>
          <ResourceIcon kind={kind} />
          <Text component={TextVariants.p} className="co-resource-item__resource-name" data-test-id={value}>
            {value}
          </Text>
        </TextContent>
      )
    );
  };

  const kubeObjContainer = (k: KubeObj) => {
    const main = kubeObjContent(k.name, k.kind, k.namespace);
    if (k.showNamespace && k.namespace) {
      return doubleContainer(main, kindContent('Namespace', k.namespace), false);
    }
    return singleContainer(main);
  };

  const kubeObjContent = (value: string | undefined, kind: string | undefined, ns: string | undefined) => {
    // Note: namespace is not mandatory here (e.g. Node objects)
    if (value && kind) {
      return (
        <div data-test={`field-resource-${kind}.${ns}.${value}`} className="force-truncate">
          {resourceIconText(value, kind, ns)}
          {kubeTooltip(value, kind, ns)}
        </div>
      );
    }
    return undefined;
  };

  const kubeTooltip = (value: string, kind: string, ns: string | undefined) => {
    return (
      <TextContent className="record-field-tooltip netobserv-no-child-margin">
        {ns && (
          <>
            <Text component={TextVariants.h4}>{t('Namespace')}</Text>
            <Text component={TextVariants.p}>{ns}</Text>
          </>
        )}
        <Text component={TextVariants.h4}>{kind}</Text>
        <Text component={TextVariants.p}>{value}</Text>
      </TextContent>
    );
  };

  const kindContent = (kind: 'Namespace' | 'Node', value?: string) => {
    if (value) {
      return (
        <div data-test={`field-kind-${kind}.${value}`} className="force-truncate">
          {resourceIconText(value, kind)}
          <TextContent className="record-field-tooltip netobserv-no-child-margin">
            <Text component={TextVariants.h4}>{t(kind)}</Text>
            <Text component={TextVariants.p}>{value}</Text>
          </TextContent>
        </div>
      );
    }
    return undefined;
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
        <FlexItem>
          <GlobeAmericasIcon className="record-field-date-icon" />
        </FlexItem>
        <FlexItem>
          <Tooltip
            content={[
              <Text component={TextVariants.p} className="co-nowrap" key="co-timestamp">
                {fullDateText}
              </Text>
            ]}
          >
            <TextContent className={`datetime ${size} netobserv-no-child-margin`}>
              <Text component={TextVariants.p}>{dateText}</Text>{' '}
              <Text component={TextVariants.p} className="text-muted">
                {timeText}
              </Text>
            </TextContent>
          </Tooltip>
        </FlexItem>
      </Flex>
    );
  };

  const nthContainer = (children: (JSX.Element | undefined)[], asChild = true, childIcon = true) => {
    return (
      <Flex className={`record-field-flex-container ${asChild ? size : ''}`} flex={{ default: 'flex_1' }}>
        {children.map((c, i) => (
          <FlexItem
            key={i}
            className={`record-field-content`}
            onMouseOver={e => onMouseOver(e, `record-field-content`)}
            flex={{ default: 'flex_1' }}
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
    if (!c.value) {
      // Value function not configured
      return emptyText();
    }
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
      case ColumnsId.tcpflags: {
        let child = emptyText();
        if (typeof value === 'number' && !isNaN(value)) {
          const flags = decomposeTCPFlagsBitfield(value);
          const name = flags.length > 0 ? flags.map(f => f.name).join(', ') : String(value);
          if (detailed) {
            let description = `${t('Value')}: ${value}`;
            if (flags.length === 1) {
              description += '. ' + flags[0].description;
            } else if (flags.length > 1) {
              description +=
                '. ' +
                t('The flow contains packets with various flags: ') +
                flags.map(f => f.name + ' (' + f.description + ')').join('; ');
            }
            child = clickableContent(name, description, getTCPFlagsDocUrl());
          } else {
            child = simpleTextWithTooltip(name)!;
          }
        }
        return singleContainer(child);
      }
      case ColumnsId.icmptype: {
        let child = emptyText();
        if (typeof value === 'number' && !isNaN(value)) {
          const proto = Number(flow.fields.Proto);
          if (isValidICMPProto(proto)) {
            const type = getICMPType(proto, value as icmpAllTypesValues);
            if (type && detailed) {
              child = clickableContent(type.name, type.description || '', getICMPDocUrl(proto));
            } else {
              child = simpleTextWithTooltip(type?.name || String(value))!;
            }
          } else {
            child = errorTextValue(
              String(value),
              t('ICMP type provided but protocol is {{proto}}', { proto: formatProtocol(proto, t) })
            );
          }
        }
        return singleContainer(child);
      }
      case ColumnsId.icmpcode: {
        let child = emptyText();
        if (typeof value === 'number' && !isNaN(value)) {
          const proto = Number(flow.fields.Proto);
          const typez = Number(flow.fields.IcmpType) as icmpAllTypesValues;
          if (isValidICMPProto(proto)) {
            const code = getICMPCode(proto, typez, value);
            if (code && detailed) {
              child = clickableContent(code.name, code.description || '', getICMPDocUrl(proto));
            } else {
              child = simpleTextWithTooltip(code?.name || String(value))!;
            }
          } else {
            child = errorTextValue(
              String(value),
              t('ICMP code provided but protocol is {{proto}}', { proto: formatProtocol(proto, t) })
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
        if (value === undefined) {
          return emptyText();
        }
        if (Array.isArray(value) && value.length) {
          // we can only show two values properly with containers
          if (value.length === 2) {
            const contents = value.map(v => (isKubeObj(v) ? kubeObjContainer(v) : simpleTextWithTooltip(String(v))));
            return doubleContainer(contents[0], contents[1]);
          }
          // else we will show values as single joigned string
          return singleContainer(simpleTextWithTooltip(value.map(v => String(v)).join(', ')));
        } else if (value && isKubeObj(value)) {
          return kubeObjContainer(value);
        } else {
          return singleContainer(simpleTextWithTooltip(String(value)));
        }
    }
  };
  return filter ? (
    <Flex className={`record-field-flex-container`} flex={{ default: 'flex_1' }}>
      <FlexItem className={'record-field-flex'} flex={{ default: 'flex_1' }}>
        {content(column)}
      </FlexItem>
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
