import { Table, Tbody, Td, Tr } from '@patternfly/react-table';
import * as React from 'react';

import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { valueFormat } from '../../utils/format';
import { AlertWithRuleName, ByResource, getHealthMetadata } from './helper';

export interface RuleDetailsProps {
  info: ByResource;
}

export const RuleDetails: React.FC<RuleDetailsProps> = ({ info }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const buildLink = (r: AlertWithRuleName): string => {
    const labels: string[] = [];
    Object.keys(r.labels).forEach(k => {
      labels.push(k + '=' + r.labels[k]);
    });
    return `/monitoring/alerts/${r.ruleID}?${labels.join('&')}`;
  };

  return (
    <Table data-test-rows-count={info.alerts.length} aria-label="Detailed alerting rules" variant="compact">
      <Tbody>
        {info.alerts.map((a, i) => {
          const md = getHealthMetadata(a.annotations);
          return (
            <Tr key={'detailed-rules-row-' + i}>
              <Td>
                <Link to={buildLink(a)} title={t('Navigate to alert details')}>
                  {a.annotations['summary']}
                </Link>
              </Td>
              <Td>{a.state}</Td>
              <Td>{a.labels.severity}</Td>
              <Td>
                {Object.keys(a.labels)
                  .filter(
                    k =>
                      k !== 'app' &&
                      k !== 'netobserv' &&
                      k !== 'severity' &&
                      k !== 'alertname' &&
                      a.labels[k] !== info.name
                  )
                  .map(k => (
                    <Label key={k}>
                      {k}={a.labels[k]}
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
