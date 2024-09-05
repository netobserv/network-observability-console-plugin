import { Button, EmptyStateSecondaryActions } from '@patternfly/react-core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Config } from '../../model/config';
import { ContextSingleton } from '../../utils/context';

export interface EmptyProps {
  resetDefaultFilters?: (c?: Config) => void;
  clearFilters?: () => void;
  showMetrics?: () => void;
  showBuildInfo?: () => void;
  showConfigLimits?: () => void;
}

export const SecondaryAction: React.FC<EmptyProps> = ({
  resetDefaultFilters,
  clearFilters,
  showMetrics,
  showBuildInfo,
  showConfigLimits
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const flowCollectorK8SModel = ContextSingleton.getFlowCollectorK8SModel();

  return (
    <>
      <EmptyStateSecondaryActions>
        {flowCollectorK8SModel && (
          <Button
            variant="link"
            component={(props: React.FunctionComponent) => (
              <Link
                {...props}
                target="_blank"
                to={{
                  pathname: `/k8s/cluster/${flowCollectorK8SModel.apiGroup}~${flowCollectorK8SModel.apiVersion}~${flowCollectorK8SModel.kind}/cluster`
                }}
              />
            )}
          >
            {t('Show FlowCollector CR')}
          </Button>
        )}
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
        {clearFilters && (
          <Button id="clear-all-filters" onClick={() => clearFilters()} variant="link">
            {t('Clear all filters')}
          </Button>
        )}
        {resetDefaultFilters && (
          <Button id="reset-filters" onClick={() => resetDefaultFilters()} variant="link">
            {t('Reset defaults filters')}
          </Button>
        )}
        {showMetrics && (
          <Button id="show-metrics" onClick={() => showMetrics()} variant="link">
            {t('Show metrics')}
          </Button>
        )}
        {showBuildInfo && (
          <Button id="show-build-info" onClick={() => showBuildInfo()} variant="link">
            {t('Show build info')}
          </Button>
        )}
        {showConfigLimits && (
          <Button id="show-config-limits" onClick={() => showConfigLimits()} variant="link">
            {t('Show configuration limits')}
          </Button>
        )}
      </EmptyStateSecondaryActions>
    </>
  );
};

export default SecondaryAction;
