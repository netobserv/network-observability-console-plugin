import { Button, Text, TextContent, TextList, TextListItem, TextVariants } from '@patternfly/react-core';
import { ExternalLinkSquareAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './error-suggestions.css';

export interface ErrorSuggestionsProps {
  error: string;
  isLokiRelated?: boolean;
  compact?: boolean;
}

export const hasSuggestionsForError = (error: string): boolean => {
  return (
    error.includes('promUnsupported') ||
    error.includes('promDisabledMetrics') ||
    error.includes('promMissingLabels') ||
    error.includes('max entries limit') ||
    error.includes('deadline exceeded') ||
    error.includes('maximum of series') ||
    error.includes('too many outstanding requests') ||
    error.includes('time range exceeds') ||
    error.includes('maximum resolution') ||
    error.includes('input size too long') ||
    error.includes('Network Error') ||
    error.includes('status code 401') ||
    error.includes('status code 403') ||
    error.includes('user not an admin') ||
    error.includes('from Loki') ||
    error.includes('from Prometheus')
  );
};

export const ErrorSuggestions: React.FC<ErrorSuggestionsProps> = ({ error, isLokiRelated = true, compact = false }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const hasSuggestions = hasSuggestionsForError(error);

  if (!hasSuggestions && !isLokiRelated) {
    return null;
  }

  return (
    <TextContent className={`error-suggestions ${compact ? 'error-suggestions-compact' : ''}`}>
      {!compact && hasSuggestions && (
        <Text component={TextVariants.p}>
          <strong>{t('Suggestions to avoid this error:')}</strong>
        </Text>
      )}

      {error.includes('promUnsupported') && (
        <>
          <Text component={TextVariants.blockquote}>
            {t('Add missing metrics to prometheus in the FlowCollector API (processor.metrics.includeList)')}
          </Text>
          <Text component={TextVariants.blockquote}>{t('Enable Loki in the FlowCollector API (loki.enable)')}</Text>
        </>
      )}

      {error.includes('promDisabledMetrics') && (
        <>
          <Text component={TextVariants.blockquote}>
            {t('Add missing metrics to prometheus in the FlowCollector API (processor.metrics.includeList)')}
          </Text>
          <Text component={TextVariants.blockquote}>{t('Enable Loki in the FlowCollector API (loki.enable)')}</Text>
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
            {t('Add Namespace, Owner or Resource filters (which use indexed fields) to improve the query performance')}
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
                        {t(`have the 'netobserv-loki-reader' cluster role, which allows multi-tenancy`)}
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
                <TextListItem>{t(`have the 'netobserv-metrics-reader' namespace-scoped role`)}</TextListItem>
                <TextListItem>
                  {t(`or for cluster-wide access, have the 'cluster-monitoring-view' cluster role`)}
                </TextListItem>
              </TextList>
            </Text>
          )}
        </>
      )}

      {isLokiRelated && (
        <div className="error-suggestions-links">
          <Button
            variant="link"
            icon={<ExternalLinkSquareAltIcon />}
            iconPosition="right"
            isInline
            component={(props: React.FunctionComponent) => (
              <Link
                {...props}
                target="_blank"
                to={{
                  pathname:
                    'https://docs.openshift.com/container-platform/latest/observability/network_observability/installing-operators.html',
                  hash: 'network-observability-loki-installation_network_observability'
                }}
              />
            )}
          >
            {t('Configuring the Loki Operator')}
          </Button>{' '}
          <Button
            variant="link"
            icon={<ExternalLinkSquareAltIcon />}
            iconPosition="right"
            isInline
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
        </div>
      )}
    </TextContent>
  );
};

export default ErrorSuggestions;
