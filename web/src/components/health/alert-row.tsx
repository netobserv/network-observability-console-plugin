import { ActionsColumn, Td, Tr } from '@patternfly/react-table';
import * as React from 'react';

import { Label, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { formatActiveSince } from '../../utils/datetime';
import { valueFormat } from '../../utils/format';
import { HealthColorSquare } from './health-color-square';
import { AlertWithRuleName, getAlertFilteredLabels, getAlertLink, getTrafficLink } from './health-helper';

export interface AlertRowProps {
  kind: string;
  resourceName: string;
  alert: AlertWithRuleName;
  wide: boolean;
}

export const AlertRow: React.FC<AlertRowProps> = ({ kind, resourceName, alert, wide }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

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
    <Tr>
      {wide && (
        <Td>
          <AlertSummaryCell alert={alert} showTooltip={false} />
        </Td>
      )}
      <Td noPadding={!wide}>{alert.state}</Td>
      <Td>{alert.labels.severity}</Td>
      {alert.activeAt && <Td>{formatActiveSince(alert.activeAt)}</Td>}
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
        {valueFormat(alert.value as number, 2)}
        {alert.metadata.threshold && ' > ' + alert.metadata.threshold + ' ' + alert.metadata.unit}
      </Td>
      {wide && <Td>{alert.annotations['description']}</Td>}
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
};

export const AlertSummaryCell: React.FC<{ alert: AlertWithRuleName; showTooltip: boolean }> = ({
  alert,
  showTooltip
}) => {
  return (
    <>
      <HealthColorSquare alert={alert} />
      {showTooltip ? (
        <Tooltip content={alert.annotations['description']}>
          <span>{alert.annotations['summary']}</span>
        </Tooltip>
      ) : (
        <>{alert.annotations['summary']}</>
      )}
    </>
  );
};
