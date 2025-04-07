import { Content, ContentVariants } from '@patternfly/react-core';
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
      {status.loki.isEnabled && (
        <>
          {status.loki.isReady === false && (
            <Content component={ContentVariants.blockquote}>
              {t(`Check if Loki is running correctly. '/ready' endpoint should respond "ready"`)}
            </Content>
          )}
          {status.loki.error && (
            <Content component={ContentVariants.blockquote}>
              {t('Loki status check error: [{{code}}] {{err}}', {
                err: status.loki.error,
                code: status.loki.errorCode
              })}
            </Content>
          )}
        </>
      )}
      {status.prometheus.isEnabled && (
        <>
          {status.prometheus.error && (
            <Content component={ContentVariants.blockquote}>
              {t('Prometheus status check error: [{{code}}] {{err}}', {
                err: status.prometheus.error,
                code: status.prometheus.errorCode
              })}
            </Content>
          )}
        </>
      )}

      {status.loki.isEnabled && !status.loki.error && status.loki.namespacesCount === 0 && (
        <Content component={ContentVariants.blockquote}>
          {t(`Can't find any namespace label in your Loki storage.`)}
        </Content>
      )}
      {status.prometheus.isEnabled && !status.prometheus.error && status.prometheus.namespacesCount === 0 && (
        <Content component={ContentVariants.blockquote}>
          {t(`Can't find any namespace label in your Prometheus storage.`)}
        </Content>
      )}
      {status &&
        ((status.loki.isEnabled && !status.loki.error && status.loki.namespacesCount === 0) ||
          (status.prometheus.isEnabled && !status.prometheus.error && status.prometheus.namespacesCount === 0)) && (
          <Content component={ContentVariants.blockquote}>
            {t(
              // eslint-disable-next-line max-len
              `If this is the first time you run the operator, check FlowCollector status and health dashboard to ensure there is no error and flows are ingested. This can take some time.`
            )}
          </Content>
        )}
      {status &&
        // Loki is operationnal and not returning error
        status.loki.isEnabled &&
        status.loki.isReady &&
        !status.loki.error &&
        // Prometheus is operationnal and not returning error
        status.prometheus.isEnabled &&
        status.prometheus.isReady &&
        !status.prometheus.error &&
        // One of the storage is empty when the other is not
        // This ensure the message is not displayed because of retention config
        ((status.loki.namespacesCount > 0 && status.prometheus.namespacesCount === 0) ||
          (status.loki.namespacesCount === 0 && status.prometheus.namespacesCount > 0)) && (
          <Content component={ContentVariants.blockquote}>
            {t(
              `Loki and Prometheus storages are diverging. The number of captured namespaces does't match. Check health dashboard for errors.`
            )}
          </Content>
        )}
    </>
  );
};

export default StatusTexts;
