import { Text, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Status } from '../../api/loki';

export interface StatusProps {
  status: Status;
}

export const StatusTexts: React.FC<StatusProps> = ({ status }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <>
      {status && status.isLokiReady === false && (
        <Text component={TextVariants.blockquote}>
          {t(`Check if Loki is running correctly. '/ready' endpoint should respond "ready"`)}
        </Text>
      )}
      {status && status.isAllowLoki && status.lokiNamespacesCount === 0 && (
        <Text component={TextVariants.blockquote}>{t(`Can't find any namespace label in your Loki storage.`)}</Text>
      )}
      {status && status.isAllowProm && status.promNamespacesCount === 0 && (
        <Text component={TextVariants.blockquote}>
          {t(`Can't find any namespace label in your Prometheus storage.`)}
        </Text>
      )}
      {status &&
        ((status.isAllowLoki && status.lokiNamespacesCount === 0) ||
          (status.isAllowProm && status.promNamespacesCount === 0)) && (
          <Text component={TextVariants.blockquote}>
            {t(
              // eslint-disable-next-line max-len
              `If this is the first time you run the operator, check FlowCollector status and health dashboard to ensure there is no error and flows are ingested. This can take some time.`
            )}
          </Text>
        )}
      {status &&
        status.isAllowLoki &&
        status.isLokiReady &&
        status.isAllowProm &&
        status.lokiNamespacesCount !== status.promNamespacesCount && (
          <Text component={TextVariants.blockquote}>
            {t(`Loki and Prom storages are not consistent. Check health dashboard for errors.`)}
          </Text>
        )}
    </>
  );
};

export default StatusTexts;
