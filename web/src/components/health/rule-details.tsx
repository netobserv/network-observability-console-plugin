import { Table, Tbody, Td, Tr } from '@patternfly/react-table';
import * as React from 'react';

import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { valueFormat } from '../../utils/format';
import { ByResource, getAlertFilteredLabels, getAlertLink, getAllAlerts, getHealthMetadata } from './helper';

export interface RuleDetailsProps {
  info: ByResource;
}

export const RuleDetails: React.FC<RuleDetailsProps> = ({ info }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const allAlerts = getAllAlerts(info);

  return (
    <Table data-test-rows-count={allAlerts.length} aria-label="Detailed alerting rules" variant="compact">
      <Tbody>
        {allAlerts.map((a, i) => {
          const md = getHealthMetadata(a.annotations);
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
                {getAlertFilteredLabels(a, info.name).map(kv => (
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
          );
        })}
      </Tbody>
    </Table>
  );
};
