import * as React from 'react';

import { Label, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { valueFormat } from '../../utils/format';
import { AlertWithRuleName, getAlertFilteredLabels, getAlertLink, getHealthMetadata } from './helper';

export interface AlertDetailsProps {
  resourceName: string;
  alert: AlertWithRuleName;
}

export const AlertDetails: React.FC<AlertDetailsProps> = ({ resourceName, alert }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const md = getHealthMetadata(alert.annotations);
  const labels = getAlertFilteredLabels(alert, resourceName);

  return (
    <div className="alert-details">
      <TextContent>
        <AlertDetailsValue title={t('Summary')}>
          <Link to={getAlertLink(alert)} title={t('Navigate to alert details')}>
            {alert.annotations['summary']}
          </Link>
        </AlertDetailsValue>
        <AlertDetailsValue title={t('State')}>{alert.state}</AlertDetailsValue>
        <AlertDetailsValue title={t('Severity')}>{alert.labels.severity}</AlertDetailsValue>
        <AlertDetailsValue title={t('Labels')}>
          {labels.length === 0
            ? t('None')
            : labels.map(kv => (
                <Label key={kv[0]}>
                  {kv[0]}={kv[1]}
                </Label>
              ))}
        </AlertDetailsValue>
        <AlertDetailsValue title={t('Value')}>
          <>
            {valueFormat(alert.value as number, 2)}
            {md?.threshold && ' > ' + md.threshold + ' ' + md.unit}
          </>
        </AlertDetailsValue>
        <AlertDetailsValue title={t('Description')}>{alert.annotations['description']}</AlertDetailsValue>
      </TextContent>
    </div>
  );
};

export const AlertDetailsValue: React.FC<{ title: string }> = ({ title, children }) => {
  return (
    <>
      <Text component={TextVariants.h4} className="alert-field-title">
        {title}
      </Text>
      <Text>{children}</Text>
    </>
  );
};
