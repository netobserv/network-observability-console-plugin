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
  TextVariants,
  Title
} from '@patternfly/react-core';
import { ExclamationCircleIcon, ExternalLinkSquareAltIcon } from '@patternfly/react-icons';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getBuildInfo, getLimits, getMetrics, getLokiReady } from '../../api/routes';
import { getHTTPErrorDetails } from '../../utils/errors';
import './loki-error.css';
import { useHistory } from 'react-router-dom';

export type Size = 's' | 'm' | 'l';

enum LokiInfo {
  Hidden,
  Metrics,
  Build,
  Limits
}

type Props = {
  title: string;
  error: string;
};

export const LokiError: React.FC<Props> = ({ title, error }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [loading, setLoading] = React.useState(true);
  const [ready, setReady] = React.useState<string | undefined>();
  const [infoName, setInfoName] = React.useState<string | undefined>();
  const [info, setInfo] = React.useState<string | undefined>();
  const history = useHistory();

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
          getMetrics()
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

  React.useEffect(() => {
    getLokiReady()
      .then(() => {
        setReady('');
      })
      .catch(err => {
        setReady(getHTTPErrorDetails(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div id="loki-error-container">
      <EmptyState data-test="error-state">
        <EmptyStateIcon className="loki-error-icon" icon={ExclamationCircleIcon} />
        <Title headingLevel="h2" size="lg">
          {title}
        </Title>
        <EmptyStateBody className="error-body">
          <Text className="loki-error-message" component={TextVariants.p}>
            {error}
          </Text>
          {
            <TextContent className="error-text-content">
              {!_.isEmpty(ready) && (
                <>
                  <Text component={TextVariants.p}>{t(`Loki '/ready' endpoint returned the following error`)}</Text>
                  <Text className="loki-error-message" component={TextVariants.p}>
                    {ready}
                  </Text>
                </>
              )}
              <Text component={TextVariants.p}>
                {t('You may consider the following query changes to avoid this error')}
              </Text>
              {!_.isEmpty(ready) && (
                <Text component={TextVariants.blockquote}>
                  {t(`Check if Loki is running correctly. '/ready' endpoint should respond "ready"`)}
                </Text>
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
            </TextContent>
          }
        </EmptyStateBody>
        <Button
          variant="link"
          icon={<ExternalLinkSquareAltIcon />}
          iconPosition="right"
          component={(props: React.FunctionComponent) => (
            <Link {...props} target="_blank" to={{ pathname: 'https://grafana.com/docs/loki/latest/configuration/' }} />
          )}
        >
          {t('Configuring Grafana Loki')}
        </Button>
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
            onClick={() => history.push('/monitoring/dashboards/grafana-dashboard-netobserv-health')}
            variant="link"
          >
            {t('Show health dashboard')}
          </Button>
        </EmptyStateSecondaryActions>
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

export default LokiError;
