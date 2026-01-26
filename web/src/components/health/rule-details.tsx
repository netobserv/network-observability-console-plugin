import { Flex, FlexItem, Label, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as React from 'react';
import { TFunction, useTranslation } from 'react-i18next';
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
import './rule-details.css';

export interface RuleDetailsProps {
  kind: string;
  alertInfo?: ByResource;
  recordingRuleInfo?: RecordingRulesByResource;
}

type RuleItem = {
  type: 'alert' | 'recording';
  alert?: AlertWithRuleName;
  recordingRule?: RecordingRuleItem;
};

// Helper: Get direction from recording rule name
const getDirection = (ruleName?: string): 'src' | 'dst' | undefined => {
  if (!ruleName) return undefined;
  return ruleName.includes(':src:') ? 'src' : ruleName.includes(':dst:') ? 'dst' : undefined;
};

// Helper: Vertical label/value column
const VerticalField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <FlexItem>
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
      <FlexItem>
        <Text component={TextVariants.small} style={{ color: 'var(--pf-v5-global--Color--200)' }}>
          {label}
        </Text>
      </FlexItem>
      <FlexItem>{children}</FlexItem>
    </Flex>
  </FlexItem>
);

// Helper: Render table row (used for Global table view)
const RuleTableRow: React.FC<{
  item: RuleItem;
  resourceName: string;
  kind: string;
  t: TFunction;
}> = ({ item, resourceName, kind, t }) => {
  const isAlert = item.type === 'alert';
  const alert = item.alert;
  const rule = item.recordingRule;

  const summary = alert ? alert.annotations['summary'] : rule?.summary || rule?.template || '';
  const mode = isAlert ? t('alert') : t('recording');
  const state = alert?.state || '';
  const severity = alert?.labels.severity || rule?.severity || '';
  const activeAt = alert?.activeAt;
  const value = alert ? (alert.value as number) : rule?.value || 0;
  const unit = alert ? alert.metadata.unit : '%';
  const threshold = alert ? alert.metadata.threshold : rule?.threshold;
  const description = React.useMemo(
    () =>
      alert
        ? alert.annotations['description']
        : rule?.description
        ? parseRecordingRuleDescription(rule.description, rule, resourceName)
        : '',
    [alert, rule, resourceName]
  );

  const labels = React.useMemo(() => (alert ? getAlertFilteredLabels(alert, resourceName) : []), [alert, resourceName]);
  const links = React.useMemo(
    () =>
      isAlert && alert
        ? [
            { name: t('Navigate to alert details'), url: getAlertLink(alert) },
            { name: t('Navigate to network traffic'), url: getTrafficLink(kind, resourceName, alert) },
            ...alert.metadata.links
          ]
        : rule
        ? [
            { name: t('View metric in query browser'), url: getRecordingRuleMetricLink(rule, resourceName) },
            ...(rule.links || [])
          ]
        : [],
    [isAlert, alert, rule, kind, resourceName, t]
  );

  const direction = React.useMemo(() => getDirection(rule?.name), [rule]);

  if (!alert && !rule) return null;

  return (
    <Tr>
      <Td dataLabel={t('Summary')}>
        <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
          <FlexItem>
            <HealthColorSquare alert={alert} recordingRule={rule} />
          </FlexItem>
          <FlexItem>
            {description && !isAlert ? (
              <Tooltip content={description}>
                <span>{summary}</span>
              </Tooltip>
            ) : (
              <span>{summary}</span>
            )}
          </FlexItem>
        </Flex>
      </Td>
      <Td dataLabel={t('Mode')}>{mode}</Td>
      <Td dataLabel={t('State')}>{state}</Td>
      <Td dataLabel={t('Severity')}>
        <Label isCompact color={getSeverityColor(severity)}>
          {severity}
        </Label>
      </Td>
      <Td dataLabel={t('Active since')}>{activeAt ? formatActiveSince(t, activeAt) : ''}</Td>
      <Td dataLabel={t('Labels')}>
        {labels.length === 0
          ? ''
          : labels.map(kv => (
              <Label key={kv[0]}>
                {kv[0]}={kv[1]}
              </Label>
            ))}
      </Td>
      <Td dataLabel={t('Value')} className="no-wrap">
        {valueFormat(value, 2)} {unit}
      </Td>
      <Td dataLabel={t('Threshold')}>{threshold ? `${threshold} ${unit}` : ''}</Td>
      <Td dataLabel={t('Direction')}>{direction || ''}</Td>
      <Td dataLabel={t('Description')}>{description}</Td>
      <Td noPadding>
        <ActionsColumn
          isDisabled={links.length === 0}
          items={links.map(l => ({ title: <a href={l.url}>{l.name}</a> }))}
        />
      </Td>
    </Tr>
  );
};

// Helper: Render card (used for Node/Namespace drawer view)
const RuleCard: React.FC<{
  item: RuleItem;
  resourceName: string;
  kind: string;
  t: TFunction;
}> = ({ item, resourceName, kind, t }) => {
  const isAlert = item.type === 'alert';
  const alert = item.alert;
  const rule = item.recordingRule;

  const summary = alert ? alert.annotations['summary'] : rule?.summary || rule?.template || '';
  const mode = isAlert ? t('alert') : t('recording');
  const state = alert?.state;
  const severity = alert?.labels.severity || rule?.severity || '';
  const activeAt = alert?.activeAt;
  const value = alert ? (alert.value as number) : rule?.value || 0;
  const unit = alert ? alert.metadata.unit : '%';
  const threshold = alert ? alert.metadata.threshold : rule?.threshold;
  const description = React.useMemo(
    () =>
      alert
        ? alert.annotations['description']
        : rule?.description
        ? parseRecordingRuleDescription(rule.description, rule, resourceName)
        : '',
    [alert, rule, resourceName]
  );

  const labels = React.useMemo(() => (alert ? getAlertFilteredLabels(alert, resourceName) : []), [alert, resourceName]);
  const links = React.useMemo(
    () =>
      isAlert && alert
        ? [
            { name: t('Navigate to alert details'), url: getAlertLink(alert) },
            { name: t('Navigate to network traffic'), url: getTrafficLink(kind, resourceName, alert) },
            ...alert.metadata.links
          ]
        : rule
        ? [
            { name: t('View metric in query browser'), url: getRecordingRuleMetricLink(rule, resourceName) },
            ...(rule.links || [])
          ]
        : [],
    [isAlert, alert, rule, kind, resourceName, t]
  );

  const direction = React.useMemo(() => getDirection(rule?.name), [rule]);

  if (!alert && !rule) return null;

  return (
    <div className="rule-details-row">
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
        {/* Header with summary and actions */}
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsFlexStart' }}
        >
          <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsFlexStart' }} flex={{ default: 'flex_1' }}>
            <FlexItem>
              <HealthColorSquare alert={alert} recordingRule={rule} />
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }}>
              <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>{summary}</FlexItem>
                {description && (
                  <FlexItem>
                    <Tooltip content={description}>
                      <InfoCircleIcon style={{ color: 'var(--pf-v5-global--Color--200)' }} />
                    </Tooltip>
                  </FlexItem>
                )}
              </Flex>
            </FlexItem>
          </Flex>
          <FlexItem>
            <ActionsColumn
              isDisabled={links.length === 0}
              items={links.map(l => ({ title: <a href={l.url}>{l.name}</a> }))}
            />
          </FlexItem>
        </Flex>

        {/* Mode, State, Severity, Value, Threshold, Active since, Direction row */}
        <Flex gap={{ default: 'gapSm' }}>
          <VerticalField label={t('Mode')}>{mode}</VerticalField>
          {state && <VerticalField label={t('State')}>{state}</VerticalField>}
          <VerticalField label={t('Severity')}>
            <Label isCompact color={getSeverityColor(severity)}>
              {severity}
            </Label>
          </VerticalField>
          <VerticalField label={t('Value')}>
            {valueFormat(value, 2)} {unit}
          </VerticalField>
          {threshold && (
            <VerticalField label={t('Threshold')}>
              {threshold} {unit}
            </VerticalField>
          )}
          {activeAt && <VerticalField label={t('Active since')}>{formatActiveSince(t, activeAt)}</VerticalField>}
          {direction && <VerticalField label={t('Direction')}>{direction}</VerticalField>}
        </Flex>

        {/* Labels */}
        {labels.length > 0 && (
          <Flex gap={{ default: 'gapXs' }} flexWrap={{ default: 'wrap' }}>
            {labels.map(kv => (
              <Label key={kv[0]} isCompact>
                {kv[0]}={kv[1]}
              </Label>
            ))}
          </Flex>
        )}
      </Flex>
    </div>
  );
};

export const RuleDetails: React.FC<RuleDetailsProps> = ({ kind, alertInfo, recordingRuleInfo }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const resourceName = alertInfo?.name || recordingRuleInfo?.name || 'Global';
  const isGlobal = kind === 'Global';

  // Combine alerts and recording rules into a unified array
  const unifiedItems = React.useMemo(() => {
    const items: RuleItem[] = [];

    if (alertInfo) {
      const allAlerts = getAllAlerts(alertInfo);
      allAlerts.forEach(alert => {
        items.push({ type: 'alert', alert });
      });
    }

    if (recordingRuleInfo) {
      const allRules = [...recordingRuleInfo.critical, ...recordingRuleInfo.warning, ...recordingRuleInfo.other];
      allRules.forEach(rule => {
        items.push({ type: 'recording', recordingRule: rule });
      });
    }

    return items;
  }, [alertInfo, recordingRuleInfo]);

  // Global view: render table
  if (isGlobal) {
    return (
      <Table
        className="rule-details"
        data-test-rows-count={unifiedItems.length}
        aria-label="Rule details"
        variant="compact"
      >
        <Thead>
          <Th>{t('Summary')}</Th>
          <Th>{t('Mode')}</Th>
          <Th>{t('State')}</Th>
          <Th>{t('Severity')}</Th>
          <Th className="no-wrap">{t('Active since')}</Th>
          <Th>{t('Labels')}</Th>
          <Th>{t('Value')}</Th>
          <Th>{t('Threshold')}</Th>
          <Th>{t('Direction')}</Th>
          <Th>{t('Description')}</Th>
          <Th screenReaderText="Links" />
        </Thead>
        <Tbody>
          {unifiedItems.map((item, i) => (
            <RuleTableRow key={`rule-row-${i}`} item={item} resourceName={resourceName} kind={kind} t={t} />
          ))}
        </Tbody>
      </Table>
    );
  }

  // Node/Namespace view: render cards
  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      {unifiedItems.map((item, i) => (
        <RuleCard key={`rule-card-${i}`} item={item} resourceName={resourceName} kind={kind} t={t} />
      ))}
    </Flex>
  );
};
