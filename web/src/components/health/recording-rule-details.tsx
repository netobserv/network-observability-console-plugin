import { Badge, Label } from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { valueFormat } from '../../utils/format';
import { getRecordingRuleMetricLink, RecordingRulesByResource } from './health-helper';

export interface RecordingRuleDetailsProps {
  kind: string;
  info: RecordingRulesByResource;
  wide: boolean;
}

export const RecordingRuleDetails: React.FC<RecordingRuleDetailsProps> = ({ kind, info, wide }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const resourceName = info.name || undefined;

  const allRules = [...info.critical, ...info.warning, ...info.other];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'warning':
        return 'orange';
      default:
        return 'blue';
    }
  };

  const getDirection = (metricName: string): string | undefined => {
    // Returns Src or Dst based on metric name pattern
    if (metricName.includes(':src:')) {
      return 'Src';
    } else if (metricName.includes(':dst:')) {
      return 'Dst';
    }
    return undefined;
  };

  return (
    <Table data-test-rows-count={allRules.length} aria-label="Recording rules" variant="compact">
      {wide && (
        <Thead>
          <Th>{t('Template')}</Th>
          <Th>{t('Severity')}</Th>
          <Th>{t('Value')}</Th>
          <Th>{t('Threshold')}</Th>
          <Th screenReaderText="Links" />
        </Thead>
      )}
      <Tbody>
        {allRules.map((rule, i) => {
          const metricLink = getRecordingRuleMetricLink(rule, resourceName);
          const links = [
            {
              name: t('View metric in query browser'),
              url: metricLink
            }
          ];

          const direction = getDirection(rule.name);

          return (
            <Tr key={'recording-rule-row-' + i}>
              <Td dataLabel={t('Template')}>
                {rule.template}
                <Badge isRead style={{ marginLeft: '0.5rem' }}>
                  {t('Recording')}
                </Badge>
                {direction && (
                  <Badge style={{ marginLeft: '0.5rem' }}>{direction}</Badge>
                )}
              </Td>
              <Td dataLabel={t('Severity')}>
                <Label color={getSeverityColor(rule.severity)}>{rule.severity}</Label>
              </Td>
              <Td dataLabel={t('Value')}>{valueFormat(rule.value)}</Td>
              <Td dataLabel={t('Threshold')}>{rule.threshold || '-'}</Td>
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
        })}
      </Tbody>
    </Table>
  );
};
