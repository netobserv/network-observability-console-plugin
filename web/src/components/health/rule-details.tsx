import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as React from 'react';

import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { valueFormat } from '../../utils/format';
import { ByResource, getAlertFilteredLabels, getAlertLink, getAllAlerts, getHealthMetadata } from './helper';

export interface RuleDetailsProps {
  info: ByResource;
  detailed: boolean;
}

export const RuleDetails: React.FC<RuleDetailsProps> = ({ info, detailed }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const allAlerts = getAllAlerts(info);

  return (
    <Table data-test-rows-count={allAlerts.length} aria-label="Detailed alerting rules" variant="compact">
      {detailed && (
        <Thead>
          <Th>{t('Summary')}</Th>
          <Th>{t('State')}</Th>
          <Th>{t('Severity')}</Th>
          <Th>{t('Labels')}</Th>
          <Th>{t('Value')}</Th>
          <Th>{t('Description')}</Th>
        </Thead>
      )}
      {detailed ? (
        <Tbody>
          {allAlerts.map((a, i) => {
            const md = getHealthMetadata(a.annotations);
            const labels = getAlertFilteredLabels(a, info.name);
            return (
              <Tr key={'detailed-rules-row-' + i}>
                <Td>
                  <Link to={getAlertLink(a)} title={t('Navigate to alert details')}>
                    {a.annotations['summary']}
                  </Link>
                </Td>
                <Td>{a.state}</Td>
                <Td>{a.labels.severity}</Td>
                <Td>
                  {labels.length === 0
                    ? t('None')
                    : labels.map(kv => (
                        <Label key={kv[0]}>
                          {kv[0]}={kv[1]}
                        </Label>
                      ))}
                </Td>
                <Td>
                  {valueFormat(a.value as number, 2)}
                  {md?.threshold && ' > ' + md.threshold + ' ' + md.unit}
                </Td>
                <Td>{a.annotations['description']}</Td>
              </Tr>
            );
          })}
        </Tbody>
      ) : (
        allAlerts.map((a, i) => {
          // in non-detailed mode, alert summaries take full cols span, and the other fields are displayed below; requires to have Tbody within Tr.
          const md = getHealthMetadata(a.annotations);
          const labels = getAlertFilteredLabels(a, info.name);
          return (
            <Tbody key={'detailed-rules-row-' + i} isExpanded>
              <Tr isExpanded>
                <Td noPadding colSpan={4}>
                  <Link to={getAlertLink(a)} title={t('Navigate to alert details')}>
                    {a.annotations['summary']}
                  </Link>
                </Td>
              </Tr>
              <Tr>
                <Td noPadding>{a.state}</Td>
                <Td>{a.labels.severity}</Td>
                <Td>
                  {labels.length === 0
                    ? t('None')
                    : labels.map(kv => (
                        <Label key={kv[0]}>
                          {kv[0]}={kv[1]}
                        </Label>
                      ))}
                </Td>
                <Td>
                  {valueFormat(a.value as number, 2)}
                  {md?.threshold && ' > ' + md.threshold + ' ' + md.unit}
                </Td>
              </Tr>
            </Tbody>
          );
        })
      )}
    </Table>
  );
};
