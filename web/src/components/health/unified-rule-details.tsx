import { Badge, Label, Tooltip } from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { formatActiveSince } from '../../utils/datetime';
import { valueFormat } from '../../utils/format';
import { HealthColorSquare } from './health-color-square';
import {
  AlertWithRuleName,
  ByResource,
  getAlertFilteredLabels,
  getAlertLink,
  getAllAlerts,
  getRecordingRuleMetricLink,
  getSeverityColor,
  getTrafficLink,
  parseRecordingRuleDescription,
  RecordingRuleItem,
  RecordingRulesByResource
} from './health-helper';
import './unified-rule-details.css';

export interface UnifiedRuleDetailsProps {
  kind: string;
  alertInfo?: ByResource;
  recordingRuleInfo?: RecordingRulesByResource;
  wide?: boolean;
}

type UnifiedRuleItem = {
  type: 'alert' | 'recording';
  alert?: AlertWithRuleName;
  recordingRule?: RecordingRuleItem;
};

export const UnifiedRuleDetails: React.FC<UnifiedRuleDetailsProps> = ({
  kind,
  alertInfo,
  recordingRuleInfo,
  wide = true
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const resourceName = alertInfo?.name || recordingRuleInfo?.name || 'Global';

  // Combine alerts and recording rules into a unified array
  const unifiedItems = React.useMemo(() => {
    const items: UnifiedRuleItem[] = [];

    // Add alerts
    if (alertInfo) {
      const allAlerts = getAllAlerts(alertInfo);
      allAlerts.forEach(alert => {
        items.push({ type: 'alert', alert });
      });
    }

    // Add recording rules
    if (recordingRuleInfo) {
      const allRules = [...recordingRuleInfo.critical, ...recordingRuleInfo.warning, ...recordingRuleInfo.other];
      allRules.forEach(rule => {
        items.push({ type: 'recording', recordingRule: rule });
      });
    }

    return items;
  }, [alertInfo, recordingRuleInfo]);

  const getDirection = React.useCallback((metricName: string): string | undefined => {
    // Returns Src or Dst based on metric name pattern
    if (metricName.includes(':src:')) {
      return 'Src';
    } else if (metricName.includes(':dst:')) {
      return 'Dst';
    }
    return undefined;
  }, []);

  const renderAlertRowWide = React.useCallback(
    (alert: AlertWithRuleName, key: string) => {
      const labels = getAlertFilteredLabels(alert, resourceName);
      const links = [
        {
          name: t('Navigate to alert details'),
          url: getAlertLink(alert)
        },
        {
          name: t('Navigate to network traffic'),
          url: getTrafficLink(kind, resourceName, alert)
        },
        ...alert.metadata.links
      ];

      return (
        <Tr key={key}>
          {/* Summary */}
          <Td dataLabel={t('Summary')}>
            <HealthColorSquare alert={alert} />
            <>{alert.annotations['summary']}</>
          </Td>
          {/* Mode */}
          <Td dataLabel={t('Mode')}>
            <Badge isRead>{t('Alert')}</Badge>
          </Td>
          {/* State */}
          <Td dataLabel={t('State')}>{alert.state}</Td>
          {/* Severity */}
          <Td dataLabel={t('Severity')}>
            {alert.labels.severity && (
              <Label color={getSeverityColor(alert.labels.severity)}>{alert.labels.severity}</Label>
            )}
          </Td>
          {/* Active since */}
          <Td dataLabel={t('Active since')}>{alert.activeAt ? formatActiveSince(t, alert.activeAt) : ''}</Td>
          {/* Labels */}
          <Td dataLabel={t('Labels')}>
            {labels.length === 0
              ? t('None')
              : labels.map(kv => (
                  <Label key={kv[0]}>
                    {kv[0]}={kv[1]}
                  </Label>
                ))}
          </Td>
          {/* Value */}
          <Td dataLabel={t('Value')} className="no-wrap">
            {valueFormat(alert.value as number, 2)} {alert.metadata.unit}
          </Td>
          {/* Threshold */}
          <Td dataLabel={t('Threshold')}>{alert.metadata.threshold ? '> ' + alert.metadata.threshold : ''}</Td>
          {/* Description */}
          <Td dataLabel={t('Description')}>{alert.annotations['description']}</Td>
          {/* Links */}
          <Td noPadding>
            <ActionsColumn
              isDisabled={links.length === 0}
              items={links.map(l => {
                return {
                  title: <a href={l.url}>{l.name}</a>
                };
              })}
            />
          </Td>
        </Tr>
      );
    },
    [kind, resourceName, t]
  );

  const renderRecordingRuleRowWide = React.useCallback(
    (rule: RecordingRuleItem, key: string) => {
      const metricLink = getRecordingRuleMetricLink(rule, resourceName);
      const links = [
        {
          name: t('View metric in query browser'),
          url: metricLink
        },
        ...(rule.links || [])
      ];
      const direction = getDirection(rule.name);
      const parsedDescription = rule.description
        ? parseRecordingRuleDescription(rule.description, rule, resourceName)
        : '';

      return (
        <Tr key={key}>
          {/* Summary/Template */}
          <Td dataLabel={t('Summary')}>
            <HealthColorSquare recordingRule={rule} />
            {parsedDescription ? (
              <Tooltip content={parsedDescription}>
                <span>{rule.summary || rule.template}</span>
              </Tooltip>
            ) : (
              <span>{rule.summary || rule.template}</span>
            )}
            {direction && <Badge style={{ marginLeft: '0.5rem' }}>{direction}</Badge>}
          </Td>
          {/* Mode */}
          <Td dataLabel={t('Mode')}>
            <Badge isRead>{t('Recording')}</Badge>
          </Td>
          {/* State - Empty for recording rules */}
          <Td dataLabel={t('State')}>{''}</Td>
          {/* Severity */}
          <Td dataLabel={t('Severity')}>
            <Label color={getSeverityColor(rule.severity)}>{rule.severity}</Label>
          </Td>
          {/* Active since - Empty for recording rules */}
          <Td dataLabel={t('Active since')}>{''}</Td>
          {/* Labels - Empty for recording rules */}
          <Td dataLabel={t('Labels')}>{''}</Td>
          {/* Value */}
          <Td dataLabel={t('Value')} className="no-wrap">
            {valueFormat(rule.value, 2)} %
          </Td>
          {/* Threshold */}
          <Td dataLabel={t('Threshold')}>{rule.threshold ? '> ' + rule.threshold : '-'}</Td>
          {/* Description */}
          <Td dataLabel={t('Description')}>{parsedDescription}</Td>
          {/* Links */}
          <Td noPadding>
            <ActionsColumn
              items={links.map(l => {
                return {
                  title: <a href={l.url}>{l.name}</a>
                };
              })}
            />
          </Td>
        </Tr>
      );
    },
    [resourceName, t, getDirection]
  );

  const renderAlertRowNarrow = React.useCallback(
    (alert: AlertWithRuleName, key: string) => {
      const labels = getAlertFilteredLabels(alert, resourceName);
      const links = [
        {
          name: t('Navigate to alert details'),
          url: getAlertLink(alert)
        },
        {
          name: t('Navigate to network traffic'),
          url: getTrafficLink(kind, resourceName, alert)
        },
        ...alert.metadata.links
      ];

      return (
        <Tbody key={key} isExpanded>
          <Tr isExpanded>
            <Td noPadding colSpan={4}>
              <HealthColorSquare alert={alert} />
              <Tooltip content={alert.annotations['description']}>
                <span>{alert.annotations['summary']}</span>
              </Tooltip>
              <Badge isRead style={{ marginLeft: '0.5rem' }}>
                {t('Alert')}
              </Badge>
            </Td>
          </Tr>
          <Tr>
            <Td noPadding>{alert.state}</Td>
            <Td>
              <Label color={getSeverityColor(alert.labels.severity)}>{alert.labels.severity}</Label>
            </Td>
            {alert.activeAt && <Td>{formatActiveSince(t, alert.activeAt)}</Td>}
            <Td>
              {labels.length === 0
                ? t('None')
                : labels.map(kv => (
                    <Label key={kv[0]}>
                      {kv[0]}={kv[1]}
                    </Label>
                  ))}
            </Td>
            <Td className="no-wrap">
              {valueFormat(alert.value as number, 2)} {alert.metadata.unit}
              {alert.metadata.threshold && ' > ' + alert.metadata.threshold}
            </Td>
            <Td noPadding>
              <ActionsColumn
                isDisabled={links.length === 0}
                items={links.map(l => {
                  return {
                    title: <a href={l.url}>{l.name}</a>
                  };
                })}
              />
            </Td>
          </Tr>
        </Tbody>
      );
    },
    [kind, resourceName, t]
  );

  const renderRecordingRuleRowNarrow = React.useCallback(
    (rule: RecordingRuleItem, key: string) => {
      const metricLink = getRecordingRuleMetricLink(rule, resourceName);
      const links = [
        {
          name: t('View metric in query browser'),
          url: metricLink
        },
        ...(rule.links || [])
      ];
      const direction = getDirection(rule.name);
      const parsedDescription = rule.description
        ? parseRecordingRuleDescription(rule.description, rule, resourceName)
        : '';

      return (
        <Tbody key={key} isExpanded>
          <Tr isExpanded>
            <Td noPadding colSpan={4}>
              <HealthColorSquare recordingRule={rule} />
              {parsedDescription ? (
                <Tooltip content={parsedDescription}>
                  <span>{rule.summary || rule.template}</span>
                </Tooltip>
              ) : (
                <span>{rule.summary || rule.template}</span>
              )}
              <Badge isRead style={{ marginLeft: '0.5rem' }}>
                {t('Recording')}
              </Badge>
              {direction && <Badge style={{ marginLeft: '0.5rem' }}>{direction}</Badge>}
            </Td>
          </Tr>
          <Tr>
            <Td noPadding>
              <Label color={getSeverityColor(rule.severity)}>{rule.severity}</Label>
            </Td>
            <Td noPadding className="no-wrap">
              {valueFormat(rule.value, 2)} % {rule.threshold && '> ' + rule.threshold}
            </Td>
            <Td noPadding className="right-align">
              <ActionsColumn
                items={links.map(l => {
                  return {
                    title: <a href={l.url}>{l.name}</a>
                  };
                })}
              />
            </Td>
          </Tr>
        </Tbody>
      );
    },
    [resourceName, t, getDirection]
  );

  return (
    <Table
      className="unified-rule-details"
      data-test-rows-count={unifiedItems.length}
      aria-label="Unified rules"
      variant="compact"
    >
      {wide && (
        <Thead>
          <Th>{t('Summary')}</Th>
          <Th>{t('Mode')}</Th>
          <Th>{t('State')}</Th>
          <Th>{t('Severity')}</Th>
          <Th className="no-wrap">{t('Active since')}</Th>
          <Th>{t('Labels')}</Th>
          <Th className="no-wrap">{t('Value')}</Th>
          <Th>{t('Threshold')}</Th>
          <Th>{t('Description')}</Th>
          <Th screenReaderText="Links" />
        </Thead>
      )}
      {wide ? (
        <Tbody>
          {unifiedItems.map((item, i) => {
            if (item.type === 'alert' && item.alert) {
              return renderAlertRowWide(item.alert, 'unified-rule-row-' + i);
            } else if (item.type === 'recording' && item.recordingRule) {
              return renderRecordingRuleRowWide(item.recordingRule, 'unified-rule-row-' + i);
            }
            return null;
          })}
        </Tbody>
      ) : (
        unifiedItems.map((item, i) => {
          if (item.type === 'alert' && item.alert) {
            return renderAlertRowNarrow(item.alert, 'unified-rule-row-' + i);
          } else if (item.type === 'recording' && item.recordingRule) {
            return renderRecordingRuleRowNarrow(item.recordingRule, 'unified-rule-row-' + i);
          }
          return null;
        })
      )}
    </Table>
  );
};
