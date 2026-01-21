import {
  Bullseye,
  ClipboardCopy,
  ClipboardCopyVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Spinner,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Status } from '../../api/loki';
import { getBuildInfo, getLimits, getLokiMetrics, getStatus } from '../../api/routes';
import { ContextSingleton } from '../../utils/context';
import { getHTTPErrorDetails, getPromError, isPromError } from '../../utils/errors';
import { ErrorSuggestions } from './error-suggestions';
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

export const ErrorComponent: React.FC<ErrorProps> = ({ title, error, isLokiRelated }) => {
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
          <TextContent className="error-text-content">
            <Text component={TextVariants.p}>{t('You may consider the following changes to avoid this error:')}</Text>
            <ErrorSuggestions error={error} isLokiRelated={isLokiRelated} compact={false} />
            {status && <StatusTexts status={status} />}
            {statusError && (
              <Text component={TextVariants.blockquote}>
                {t('Check for errors in health dashboard. Status endpoint is returning: {{statusError}}', {
                  statusError
                })}
              </Text>
            )}
          </TextContent>
        </EmptyStateBody>
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

export default ErrorComponent;
