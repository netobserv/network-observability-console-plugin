import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as React from 'react';

import { useTranslation } from 'react-i18next';
import { AlertRow, AlertSummaryCell } from './alert-row';
import { ByResource, getAllAlerts } from './health-helper';

export interface RuleDetailsProps {
  kind: string;
  info: ByResource;
  wide: boolean;
}

export const RuleDetails: React.FC<RuleDetailsProps> = ({ kind, info, wide }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const allAlerts = getAllAlerts(info);

  return (
    <Table data-test-rows-count={allAlerts.length} aria-label="Detailed alerting rules" variant="compact">
      {wide && (
        <Thead>
          <Th>{t('Summary')}</Th>
          <Th>{t('State')}</Th>
          <Th>{t('Severity')}</Th>
          <Th>{t('Labels')}</Th>
          <Th>{t('Value')}</Th>
          <Th>{t('Description')}</Th>
          <Th screenReaderText="Links" />
        </Thead>
      )}
      {wide ? (
        <Tbody>
          {allAlerts.map((a, i) => (
            <AlertRow key={'detailed-rules-row-' + i} kind={kind} alert={a} resourceName={info.name} wide={wide} />
          ))}
        </Tbody>
      ) : (
        allAlerts.map((a, i) => {
          // in non-detailed mode, alert summaries take full cols span, and the other fields are displayed below; requires to have a Tbody for each row.
          return (
            <Tbody key={'detailed-rules-row-' + i} isExpanded>
              <Tr isExpanded>
                <Td noPadding colSpan={4}>
                  <AlertSummaryCell alert={a} showTooltip={true} />
                </Td>
              </Tr>
              <AlertRow kind={kind} alert={a} resourceName={info.name} wide={wide} />
            </Tbody>
          );
        })
      )}
    </Table>
  );
};
