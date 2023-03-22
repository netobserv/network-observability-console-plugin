import * as React from 'react';
import AlertBanner from './banner';
import { getAlerts } from '../../api/routes';
import { Rule } from '@openshift-console/dynamic-plugin-sdk';

import { murmur3 } from 'murmurhash-js';

type AlertFetcherProps = {};

export const AlertFetcher: React.FC<AlertFetcherProps> = ({ children }) => {
  const [alerts, setAlerts] = React.useState<Rule[]>([]);
  React.useEffect(() => {
    getAlerts()
      .then(result => {
        setAlerts(
          result.data.groups.flatMap(group => {
            return group.rules
              .filter(rule => !!rule.labels.app && rule.labels.app == 'netobserv' && rule.state == 'firing')
              .map(rule => {
                const key = [
                  group.file,
                  group.name,
                  rule.name,
                  String(rule.duration),
                  rule.query,
                  `${rule.labels.app}=app`,
                  `${rule.labels.prometheus}=prometheus`,
                  `${rule.labels.severity}=severity`
                ].join(',');
                rule.id = String(murmur3(key, 0));
                return rule;
              });
          })
        );
      })
      .catch(() => {
        console.log('Could not get alerts');
      });
    return;
  }, []);
  return (
    <>
      <div className="netobserv-alerts-container">
        {alerts.map(a => (
          <AlertBanner key={a.name} rule={a} onDelete={() => setAlerts(alerts.filter(alert => alert.name != a.name))} />
        ))}
      </div>
      {!!children ? children : ''}
    </>
  );
};

export default AlertFetcher;
