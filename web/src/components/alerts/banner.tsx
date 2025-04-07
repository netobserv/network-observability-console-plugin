import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertActionCloseButton, AlertActionLink, Content, ContentVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../dynamic-loader/dynamic-loader';
import './banner.css';

export interface AlertBannerProps {
  rule: Rule;
  onDelete: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ rule, onDelete }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const routeAlert = () => {
    let path = `/monitoring/alerts/${rule.id}`;
    path += `?alertname=${rule.name}&app=${rule.labels.app}&severity=${rule.labels.severity}`;
    navigate(path);
  };
  const routeDashboard = () => {
    const path = `/monitoring/dashboards/grafana-dashboard-netobserv-health`;
    navigate(path);
  };
  return (
    <div className="netobserv-alert">
      <Alert
        title={rule.name}
        isInline={true}
        variant="danger"
        actionClose={<AlertActionCloseButton onClose={onDelete} />}
        actionLinks={
          <React.Fragment>
            <AlertActionLink onClick={routeAlert}>{t('View alert details')}</AlertActionLink>
            <AlertActionLink onClick={routeDashboard}>{t('View health dashboard')}</AlertActionLink>
          </React.Fragment>
        }
      >
        <Content component={ContentVariants.p}>
          {rule.annotations.description ? rule.annotations.description : ''}
        </Content>
      </Alert>
    </div>
  );
};

export default AlertBanner;
