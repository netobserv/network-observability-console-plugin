import { useTranslation } from 'react-i18next';
import * as React from 'react';
import {
  Alert,
  AlertActionLink,
  AlertActionCloseButton,
  TextContent,
  Text,
  TextVariants
} from '@patternfly/react-core';
import './banner.css';
import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import { useHistory } from 'react-router-dom';

export const AlertBanner: React.FC<{
  rule: Rule;
  onDelete: () => void;
}> = ({ rule, onDelete }) => {
  const history = useHistory();
  const { t } = useTranslation('plugin__netobserv-plugin');
  const routeAlert = () => {
    let path = `/monitoring/alerts/${rule.id}`;
    path += `?alertname=${rule.name}&app=${rule.labels.app}&severity=${rule.labels.severity}`;
    history.push(path);
  };
  const routeDashboard = () => {
    const path = `/monitoring/dashboards/grafana-dashboard-netobserv-health`;
    history.push(path);
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
        <TextContent>
          <Text component={TextVariants.p}>{!!rule.annotations.description ? rule.annotations.description : ''}</Text>
        </TextContent>
      </Alert>
    </div>
  );
};

export default AlertBanner;
