import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Status } from '../../api/loki';
import { getStatus } from '../../api/routes';
import { Config } from '../../model/config';
import { ContextSingleton } from '../../utils/context';
import { getHTTPErrorDetails } from '../../utils/errors';
import './empty.css';
import { SecondaryAction } from './secondary-action';
import { StatusTexts } from './status-texts';

export interface EmptyProps {
  showDetails: boolean;
  resetDefaultFilters?: (c?: Config) => void;
  clearFilters?: () => void;
  isTopology?: boolean;
}

export const Empty: React.FC<EmptyProps> = ({ showDetails, resetDefaultFilters, clearFilters, isTopology }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [namespacesLoading, setNamespacesLoading] = React.useState(showDetails);
  const [status, setStatus] = React.useState<Status | undefined>();
  const [statusError, setStatusError] = React.useState<string | undefined>();

  React.useEffect(() => {
    //jest crashing on getNamespaces not defined so we need to ensure the function is defined here
    if (!getStatus || !showDetails) {
      return;
    }

    let isMounted = true;

    getStatus(ContextSingleton.getForcedNamespace())
      .then(status => {
        if (isMounted) {
          console.info('status result', status);
          setStatus(status);
          setStatusError(undefined);
        }
      })
      .catch(err => {
        if (isMounted) {
          const errorMessage = getHTTPErrorDetails(err);
          console.error(errorMessage);
          setStatusError(errorMessage);
          setStatus(undefined);
        }
      })
      .finally(() => {
        if (isMounted) {
          setNamespacesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showDetails]);

  return (
    <EmptyState variant={!showDetails ? EmptyStateVariant.sm : undefined} data-test="empty-state">
      <EmptyStateIcon className={`netobserv-empty-icon${showDetails ? '' : '-small'}`} icon={SearchIcon} />
      <Title headingLevel="h2" size="lg">
        {t('No results found')}
      </Title>
      {showDetails && (
        <EmptyStateBody className="empty-body">
          {statusError === undefined && (
            <Text className="netobserv-empty-message" component={TextVariants.p}>
              {isTopology
                ? t('Clear or reset filters and try again. You may also try changing the scope.')
                : t('Clear or reset filters and try again.')}
            </Text>
          )}
          {statusError !== undefined && (
            <Text className="netobserv-error-message" component={TextVariants.p}>
              {t('Check for errors in health dashboard. Status endpoint is returning: {{statusError}}', {
                statusError
              })}
            </Text>
          )}
          <TextContent className="empty-text-content">
            {namespacesLoading && (
              <Bullseye data-test="loading-empty">
                <Spinner size="xl" />
              </Bullseye>
            )}
            {status && <StatusTexts status={status} />}
          </TextContent>
        </EmptyStateBody>
      )}
      {showDetails && <SecondaryAction resetDefaultFilters={resetDefaultFilters} clearFilters={clearFilters} />}
    </EmptyState>
  );
};

export default Empty;
