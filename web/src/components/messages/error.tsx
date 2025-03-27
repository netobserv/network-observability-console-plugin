import {
  Bullseye,
  Button,
  ClipboardCopy,
  ClipboardCopyVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Spinner,
  Text,
  TextContent,
  TextList,
  TextListItem,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { ExclamationCircleIcon, ExternalLinkSquareAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Status } from '../../api/loki';
import { getBuildInfo, getLimits, getLokiMetrics, getStatus } from '../../api/routes';
import { ContextSingleton } from '../../utils/context';
import { getHTTPErrorDetails, getPromError, isPromError } from '../../utils/errors';
import './error.css';
import { SecondaryAction } from './secondary-action';
import { StatusTexts } from './status-texts';

export type Size = 's' | 'm' | 'l';

enum LokiInfo {
  Hidden,
  Metrics,
  Build,
  Limits
}

export interface ErrorProps {
  title: string;
  error: string;
  // TODO: (NETOBSERV-1877) refactor error type handling.
  // "isLokiRelated" actually means here: "is neither prom-unsupported nor config loading error". But could actually be other than Loki related.
  isLokiRelated: boolean;
}

export const Error: React.FC<ErrorProps> = ({ title, error, isLokiRelated }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [lokiLoading, setLokiLoading] = React.useState(isLokiRelated);
  const [statusLoading, setStatusLoading] = React.useState(true);
  const [status, setStatus] = React.useState<Status | undefined>();
  const [statusError, setStatusError] = React.useState<string | undefined>();
  const [infoName, setInfoName] = React.useState<string | undefined>();
  const [info, setInfo] = React.useState<string | undefined>();

  const updateInfo = React.useCallback(
    (type: LokiInfo) => {
      setLokiLoading(true);

      switch (type) {
        case LokiInfo.Build:
          setInfoName(t('Build info'));
          getBuildInfo()
            .then(data => setInfo(JSON.stringify(data, null, 2)))
            .catch(err => {
              setInfo(getHTTPErrorDetails(err));
            })
            .finally(() => {
              setLokiLoading(false);
            });
          break;
        case LokiInfo.Limits:
          setInfoName(t('Configuration limits'));
          getLimits()
            .then(data => setInfo(JSON.stringify(data, null, 2)))
            .catch(err => {
              setInfo(getHTTPErrorDetails(err));
            })
            .finally(() => {
              setLokiLoading(false);
            });
          break;
        case LokiInfo.Metrics:
          setInfoName(t('Metrics'));
          getLokiMetrics()
            .then(data => setInfo(data))
            .catch(err => {
              setInfo(getHTTPErrorDetails(err));
            })
            .finally(() => {
              setLokiLoading(false);
            });
          break;
        case LokiInfo.Hidden:
        default:
          setInfoName(undefined);
          setInfo(undefined);
          setLokiLoading(false);
          break;
      }
    },
    [t]
  );

  const getDisplayError = React.useCallback(() => {
    return isPromError(error) ? getPromError(error) : error;
  }, [error]);

  React.useEffect(() => {
    //jest crashing on getStatus not defined so we need to ensure the function is defined here
    if (!getStatus) {
      return;
    }

    getStatus(ContextSingleton.getForcedNamespace())
      .then(status => {
        console.info('status result', status);
        setStatus(status);
        setStatusError(undefined);
      })
      .catch(err => {
        const errorMessage = getHTTPErrorDetails(err);
        console.error(errorMessage);
        setStatusError(errorMessage);
        setStatus(undefined);
      })
      .finally(() => {
        setStatusLoading(false);
      });
  }, []);

  return (
    <div id="netobserv-error-container">
      <EmptyState data-test="error-state">
        <EmptyStateIcon className="netobserv-error-icon" icon={ExclamationCircleIcon} />
        <Title headingLevel="h2" size="lg">
          {title}
        </Title>
        <EmptyStateBody className="error-body">
          <Text className="netobserv-error-message" component={TextVariants.p}>
            {getDisplayError()}
          </Text>
          {
            <TextContent className="error-text-content">
              <Text component={TextVariants.p}>{t('You may consider the following changes to avoid this error:')}</Text>
              {error.includes('promUnsupported') && (
                <>
                  <Text component={TextVariants.blockquote}>
                    {t('Add missing metrics to prometheus in the FlowCollector API (processor.metrics.includeList)')}
                  </Text>
                  <Text component={TextVariants.blockquote}>
                    {t('Enable Loki in the FlowCollector API (loki.enable)')}
                  </Text>
                </>
              )}
              {error.includes('max entries limit') && (
                <>
                  <Text component={TextVariants.blockquote}>
                    {t('Reduce the Query Options -> limit to reduce the number of results')}
                  </Text>
                  <Text component={TextVariants.blockquote}>
                    {t('Increase Loki "max_entries_limit_per_query" entry in configuration file')}
                  </Text>
                </>
              )}
              {(error.includes('deadline exceeded') ||
                error.includes('maximum of series') ||
                error.includes('too many outstanding requests')) && (
                <>
                  <Text component={TextVariants.blockquote}>
                    {t(
                      // eslint-disable-next-line max-len
                      'Add Namespace, Owner or Resource filters (which use indexed fields) to improve the query performance'
                    )}
                  </Text>
                  <Text component={TextVariants.blockquote}>
                    {t('Reduce limit and time range to decrease the number of results')}
                  </Text>
                  <Text component={TextVariants.blockquote}>
                    {t('Increase time step to decrease the number of parallel queries')}
                  </Text>
                  {error.includes('too many outstanding requests') && (
                    <Text component={TextVariants.blockquote}>
                      {t(
                        // eslint-disable-next-line max-len
                        'Ensure Loki config contains "parallelise_shardable_queries: true" and "max_outstanding_requests_per_tenant: 2048"'
                      )}
                    </Text>
                  )}
                </>
              )}
              {(error.includes('time range exceeds') || error.includes('maximum resolution')) && (
                <>
                  <Text component={TextVariants.blockquote}>
                    {t('Reduce the time range to decrease the number of results')}
                  </Text>
                  <Text component={TextVariants.blockquote}>
                    {t('Increase Loki "max_query_length" entry in configuration file')}
                  </Text>
                </>
              )}
              {error.includes('input size too long') && (
                <>
                  <Text component={TextVariants.blockquote}>
                    {t('This error is generally seen when cluster admin groups are not properly configured.')}{' '}
                    {t('Click the link below for more help.')}
                  </Text>
                  <Button
                    variant="link"
                    icon={<ExternalLinkSquareAltIcon />}
                    iconPosition="right"
                    component={(props: React.FunctionComponent) => (
                      <Link
                        {...props}
                        target="_blank"
                        to={{
                          pathname: 'https://github.com/netobserv/documents/blob/main/loki_operator.md',
                          hash: 'loki-input-size-too-long-error'
                        }}
                      />
                    )}
                  >
                    {t('More information')}
                  </Button>
                </>
              )}
              {error.includes('Network Error') && (
                <Text component={TextVariants.blockquote}>
                  {t(`Check your connectivity with cluster / console plugin pod`)}
                </Text>
              )}

              {(error.includes('status code 401') || error.includes('status code 403')) && (
                <>
                  <Text component={TextVariants.blockquote}>{t(`Check current user permissions`)}</Text>
                  {error.includes('user not an admin') ? (
                    <Text component={TextVariants.blockquote}>
                      {t(
                        `This deployment mode does not support non-admin users. Check FlowCollector spec.loki.manual.authToken`
                      )}
                    </Text>
                  ) : (
                    <>
                      {error.includes('from Loki') && (
                        <>
                          <Text component={TextVariants.blockquote}>
                            {t(`For LokiStack, your user must either:`)}
                            <TextList>
                              <TextListItem>
                                {t(`have the 'netobserv-reader' cluster role, which allows multi-tenancy`)}
                              </TextListItem>
                              <TextListItem>
                                {t(`or be in the 'cluster-admin' group (not the same as the 'cluster-admin' role)`)}
                              </TextListItem>
                              <TextListItem>
                                {t(
                                  `or LokiStack spec.tenants.openshift.adminGroups must be configured with a group this user belongs to`
                                )}
                              </TextListItem>
                            </TextList>
                          </Text>
                          <Text component={TextVariants.blockquote}>
                            {t(`For other configurations, refer to FlowCollector spec.loki.manual.authToken`)}
                          </Text>
                        </>
                      )}
                    </>
                  )}
                  {error.includes('from Prometheus') && (
                    <Text component={TextVariants.blockquote}>
                      {t(`For metrics access, your user must either:`)}
                      <TextList>
                        <TextListItem>
                          {t(
                            `have the 'netobserv-metrics-reader' namespace-scoped role, and use only the Developer view of the Console`
                          )}
                        </TextListItem>
                        <TextListItem>
                          {t(`or for cluster-wide access, have the 'cluster-monitoring-view' cluster role`)}
                        </TextListItem>
                      </TextList>
                    </Text>
                  )}
                </>
              )}

              {status && <StatusTexts status={status} />}
              {statusError && (
                <Text component={TextVariants.blockquote}>
                  {t('Check for errors in health dashboard. Status endpoint is returning: {{statusError}}', {
                    statusError
                  })}
                </Text>
              )}
            </TextContent>
          }
        </EmptyStateBody>
        {isLokiRelated && (
          <>
            <Button
              variant="link"
              icon={<ExternalLinkSquareAltIcon />}
              iconPosition="right"
              component={(props: React.FunctionComponent) => (
                <Link
                  {...props}
                  target="_blank"
                  to={{
                    pathname:
                      // eslint-disable-next-line max-len
                      'https://docs.openshift.com/container-platform/latest/observability/network_observability/installing-operators.html',
                    hash: 'network-observability-loki-installation_network_observability'
                  }}
                />
              )}
            >
              {t('Configuring the Loki Operator')}
            </Button>
            <Button
              variant="link"
              icon={<ExternalLinkSquareAltIcon />}
              iconPosition="right"
              component={(props: React.FunctionComponent) => (
                <Link
                  {...props}
                  target="_blank"
                  to={{ pathname: 'https://grafana.com/docs/loki/latest/configuration/' }}
                />
              )}
            >
              {t('Configuring Grafana Loki (community)')}
            </Button>
          </>
        )}
        <SecondaryAction
          showMetrics={() => updateInfo(LokiInfo.Metrics)}
          showBuildInfo={() => updateInfo(LokiInfo.Build)}
          showConfigLimits={() => updateInfo(LokiInfo.Limits)}
        />
      </EmptyState>
      {lokiLoading || statusLoading ? (
        <Bullseye data-test="loading-errors">
          <Spinner size="xl" />
        </Bullseye>
      ) : (
        info && (
          <TextContent>
            <Text component={TextVariants.h4}>{infoName}</Text>
            <ClipboardCopy
              isCode
              isExpanded
              hoverTip={t('Copy')}
              clickTip={t('Copied')}
              variant={ClipboardCopyVariant.expansion}
            >
              {info}
            </ClipboardCopy>
          </TextContent>
        )
      )}
    </div>
  );
};

export default Error;
