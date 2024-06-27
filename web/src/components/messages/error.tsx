import {
  Bullseye,
  Button,
  ClipboardCopy,
  ClipboardCopyVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
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
import { getBuildInfo, getLimits, getLokiMetrics, getLokiReady } from '../../api/routes';
import { getHTTPErrorDetails, getPromUnsupportedError, isPromUnsupportedError } from '../../utils/errors';
import './error.css';

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
  isLokiRelated: boolean;
}

export const Error: React.FC<ErrorProps> = ({ title, error, isLokiRelated }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [loading, setLoading] = React.useState(isLokiRelated);
  const [ready, setReady] = React.useState<boolean | undefined>();
  const [infoName, setInfoName] = React.useState<string | undefined>();
  const [info, setInfo] = React.useState<string | undefined>();

  const updateInfo = React.useCallback(
    (type: LokiInfo) => {
      setLoading(true);

      switch (type) {
        case LokiInfo.Build:
          setInfoName(t('Build info'));
          getBuildInfo()
            .then(data => setInfo(JSON.stringify(data, null, 2)))
            .catch(err => {
              setInfo(getHTTPErrorDetails(err));
            })
            .finally(() => {
              setLoading(false);
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
              setLoading(false);
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
              setLoading(false);
            });
          break;
        case LokiInfo.Hidden:
        default:
          setInfoName(undefined);
          setInfo(undefined);
          setLoading(false);
          break;
      }
    },
    [t]
  );

  const getDisplayError = React.useCallback(() => {
    return isPromUnsupportedError(error) ? getPromUnsupportedError(error) : error;
  }, [error]);

  React.useEffect(() => {
    //jest crashing on getLokiReady not defined so we need to ensure the function is defined here
    if (getLokiReady && isLokiRelated) {
      getLokiReady()
        .then(() => {
          setReady(true);
        })
        .catch(err => {
          console.error(getHTTPErrorDetails(err));
          setReady(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isLokiRelated]);

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
                    {t('Add missing metrics to prometheus using FlowMetric API')}
                  </Text>
                  <Text component={TextVariants.blockquote}>{t('Enable Loki in FlowCollector API')}</Text>
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
                          pathname:
                            'https://github.com/netobserv/documents/blob/main/loki_operator.md#loki-input-size-too-long-error'
                        }}
                      />
                    )}
                  >
                    {t('More information')}
                  </Button>
                </>
              )}
              {ready === false && (
                <>
                  <Text component={TextVariants.blockquote}>
                    {t(`Check if Loki is running correctly. '/ready' endpoint should respond "ready"`)}
                  </Text>
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
                      'https://docs.openshift.com/container-platform/latest/observability/network_observability/installing-operators.html#network-observability-loki-installation_network_observability'
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
        {isLokiRelated && (
          <EmptyStateSecondaryActions>
            <Button onClick={() => updateInfo(LokiInfo.Metrics)} variant="link">
              {t('Show metrics')}
            </Button>
            <Button onClick={() => updateInfo(LokiInfo.Build)} variant="link">
              {t('Show build info')}
            </Button>
            <Button onClick={() => updateInfo(LokiInfo.Limits)} variant="link">
              {t('Show configuration limits')}
            </Button>
            <Button
              variant="link"
              component={(props: React.FunctionComponent) => (
                <Link
                  {...props}
                  target="_blank"
                  to={{ pathname: '/monitoring/dashboards/grafana-dashboard-netobserv-health' }}
                />
              )}
            >
              {t('Show health dashboard')}
            </Button>
          </EmptyStateSecondaryActions>
        )}
      </EmptyState>
      {loading ? (
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
