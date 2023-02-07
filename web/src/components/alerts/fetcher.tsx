import * as React from 'react';
import AlertBanner from './banner';
import { getAlerts } from '../../api/routes';
import { AlertsRule } from '../../api/alert';

import { murmur3 } from 'murmurhash-js';

type AlertFetcherProps = {};

export const AlertFetcher: React.FC<AlertFetcherProps> = ({ children }) => {
  const [alerts, setAlerts] = React.useState<AlertsRule[]>([]);
  React.useEffect(() => {
    getAlerts().then(result => {
      setAlerts(
        result.data.groups.flatMap(group => {
          return group.rules
            .filter(rule => !!rule.labels.namespace && rule.labels.namespace == 'netobserv' && rule.state == 'firing')
            .map(rule => {
              const key = [
                group.file,
                group.name,
                rule.name,
                String(rule.duration),
                rule.query,
                `${rule.labels.namespace}=namespace`,
                `${rule.labels.severity}=severity`
              ].join(',');
              rule.id = String(murmur3(key, 0));
              return rule;
            });
        })
      );
    });
    return;
  }, []);
  return (
    <div>
      {alerts.map(a => (
        <AlertBanner key={a.name} rule={a} onDelete={() => setAlerts(alerts.filter(alert => alert.name != a.name))} />
      ))}
      {!!children ? children : ''}
    </div>
  );
};

export default AlertFetcher;
