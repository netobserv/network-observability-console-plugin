import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  Button,
  ExpandableSection,
  Popover
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricError } from '../../api/loki';
import { isPromError } from '../../utils/errors';
import './error-banner.css';
import { ErrorSuggestions, hasSuggestionsForError } from './error-suggestions';

const MAX_VISIBLE_METRICS = 3;

export interface ErrorBannerProps {
  errors: MetricError[];
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ errors, onDismiss }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [dismissed, setDismissed] = React.useState(false);
  const [expandedErrors, setExpandedErrors] = React.useState<Record<string, boolean>>({});

  if (dismissed || !errors || errors.length === 0) {
    return null;
  }

  // Determine if errors are Loki-related (not Prometheus errors)
  const isLokiRelated = !errors.some(e => isPromError(e.error));

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const toggleExpanded = (errorKey: string) => {
    setExpandedErrors(prev => ({
      ...prev,
      [errorKey]: !prev[errorKey]
    }));
  };

  // Group errors by error message to avoid duplicates, collect metric types
  const errorGroups = errors.reduce((acc, err) => {
    if (!acc[err.error]) {
      acc[err.error] = [];
    }
    acc[err.error].push(err.metricType);
    return acc;
  }, {} as Record<string, string[]>);

  const renderMetricTypes = (metricTypes: string[]) => {
    if (metricTypes.length <= MAX_VISIBLE_METRICS) {
      return <strong>{metricTypes.join(', ')}:</strong>;
    }

    const visibleMetrics = metricTypes.slice(0, MAX_VISIBLE_METRICS);
    const hiddenCount = metricTypes.length - MAX_VISIBLE_METRICS;
    const allMetricsList = (
      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
        {metricTypes.map((metric, idx) => (
          <li key={idx}>{metric}</li>
        ))}
      </ul>
    );

    return (
      <strong>
        {visibleMetrics.join(', ')}{' '}
        <Popover headerContent={t('All affected metrics')} bodyContent={allMetricsList} position="right">
          <Button variant="link" isInline className="netobserv-error-banner-popover-button">
            {t('and {{count}} more', { count: hiddenCount })}
          </Button>
        </Popover>
        :
      </strong>
    );
  };

  return (
    <div className="netobserv-error-banner">
      <AlertGroup isToast={false}>
        <Alert
          variant={AlertVariant.danger}
          title={t('Some metrics failed to load')}
          actionClose={<AlertActionCloseButton onClose={handleDismiss} />}
          isInline
        >
          {Object.entries(errorGroups).map(([errorMessage, metricTypes]) => {
            const errorKey = errorMessage;
            const hasSuggestions = hasSuggestionsForError(errorMessage);
            return (
              <div key={errorMessage} className="netobserv-error-banner-item">
                <div>
                  {renderMetricTypes(metricTypes)} {errorMessage}
                </div>
                {hasSuggestions && (
                  <ExpandableSection
                    toggleText={expandedErrors[errorKey] ? t('Hide suggestions') : t('Show suggestions')}
                    onToggle={() => toggleExpanded(errorKey)}
                    isExpanded={expandedErrors[errorKey]}
                    isIndented
                  >
                    <ErrorSuggestions error={errorMessage} isLokiRelated={isLokiRelated} compact={true} />
                  </ExpandableSection>
                )}
              </div>
            );
          })}
        </Alert>
      </AlertGroup>
    </div>
  );
};

export default ErrorBanner;
