import { Bullseye, EmptyState, EmptyStateBody, EmptyStateIcon, Text, TextVariants } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { isPromError } from '../../utils/errors';
import { ErrorSuggestions } from './error-suggestions';
import './panel-error-indicator.css';

export interface PanelErrorIndicatorProps {
  error?: string;
  metricType?: string;
  showDetails?: boolean;
}

export const PanelErrorIndicator: React.FC<PanelErrorIndicatorProps> = ({ error, metricType, showDetails = true }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  if (!error) {
    return null;
  }

  return (
    <Bullseye className="panel-error-indicator">
      <EmptyState>
        <EmptyStateIcon
          className="panel-error-icon"
          icon={ExclamationCircleIcon}
          color="var(--pf-v5-global--danger-color--100)"
        />
        <Text component={TextVariants.h3}>{t('Failed to load {{metric}}', { metric: metricType || t('metric') })}</Text>
        {showDetails && (
          <EmptyStateBody className="panel-error-body">
            <Text component={TextVariants.p} className="panel-error-message">
              {error}
            </Text>
            <ErrorSuggestions error={error} isLokiRelated={!isPromError(error)} />
          </EmptyStateBody>
        )}
      </EmptyState>
    </Bullseye>
  );
};

export default PanelErrorIndicator;
