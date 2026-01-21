import { Badge, Label, Tooltip } from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { valueFormat } from '../../utils/format';
import {
  getRecordingRuleMetricLink,
  getSeverityColor,
  parseRecordingRuleDescription,
  RecordingRulesByResource
} from './health-helper';

export interface RecordingRuleDetailsProps {
  kind: string;
  info: RecordingRulesByResource;
  wide: boolean;
}

export const RecordingRuleDetails: React.FC<RecordingRuleDetailsProps> = ({ info, wide }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const resourceName = info.name || undefined;

  const allRules = React.useMemo(
    () => [...info.critical, ...info.warning, ...info.other],
    [info.critical, info.warning, info.other]
  );

  const getDirection = React.useCallback((metricName: string): string | undefined => {
    // Returns Src or Dst based on metric name pattern
    if (metricName.includes(':src:')) {
      return 'Src';
    } else if (metricName.includes(':dst:')) {
      return 'Dst';
    }
    return undefined;
  }, []);

  return (
    <Table data-test-rows-count={allRules.length} aria-label="Recording rules" variant="compact">
      {wide && (
        <Thead>
          <Th style={{ paddingRight: '5px' }}>{t('Summary')}</Th>
          <Th style={{ paddingRight: '5px' }}>{t('Severity')}</Th>
          <Th style={{ paddingRight: '5px' }}>{t('Value')}</Th>
          <Th style={{ paddingRight: '5px' }}>{t('Threshold')}</Th>
          <Th style={{ paddingRight: '5px' }}>{t('Description')}</Th>
          <Th screenReaderText="Links" />
        </Thead>
      )}
      {wide ? (
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
            const parsedDescription = rule.description
              ? parseRecordingRuleDescription(rule.description, rule, resourceName)
              : '';

            return (
              <Tr key={'recording-rule-row-' + i}>
                {wide && (
                  <Td>
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
                )}
                <Td noPadding={!wide}>
                  <Label color={getSeverityColor(rule.severity)}>{rule.severity}</Label>
                </Td>
                <Td noPadding={!wide}>
                  {valueFormat(rule.value, 2)} %{!wide && rule.threshold && ' > ' + rule.threshold}
                </Td>
                {wide && <Td>{rule.threshold ? '> ' + rule.threshold : '-'}</Td>}
                {wide && <Td>{parsedDescription}</Td>}
                <Td noPadding style={{ textAlign: 'right' }}>
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
      ) : (
        allRules.map((rule, i) => {
          const metricLink = getRecordingRuleMetricLink(rule, resourceName);
          const links = [
            {
              name: t('View metric in query browser'),
              url: metricLink
            }
          ];

          const direction = getDirection(rule.name);
          const parsedDescription = rule.description
            ? parseRecordingRuleDescription(rule.description, rule, resourceName)
            : '';

          // in non-detailed mode, summary takes full cols span, and the other fields are displayed below; requires to have a Tbody for each row.
          return (
            <Tbody key={'recording-rule-row-' + i} isExpanded>
              <Tr isExpanded>
                <Td noPadding colSpan={4}>
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
                <Td noPadding>
                  {valueFormat(rule.value, 2)} % {rule.threshold && '> ' + rule.threshold}
                </Td>
                <Td noPadding style={{ textAlign: 'right' }}>
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
        })
      )}
    </Table>
  );
};
