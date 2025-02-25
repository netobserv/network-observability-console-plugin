import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { getAlerts, getSilencedAlerts } from '../../api/routes';
import AlertBanner from './banner';

import { murmur3 } from 'murmurhash-js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AlertFetcherProps {}

export const AlertFetcher: React.FC<AlertFetcherProps> = ({ children }) => {
  const [alerts, setAlerts] = React.useState<Rule[]>([]);
  const [silencedAlerts, setSilencedAlerts] = React.useState<string[] | null>(null);
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

  React.useEffect(() => {
    getSilencedAlerts()
      .then(result => {
        setSilencedAlerts(
          result
            .filter(rule => rule.status.state == 'active')
            .map(rule => {
              const matcher = rule.matchers.find(m => m.name == 'alertname');
              return typeof matcher !== 'undefined' ? matcher.value : '';
            })
        );
      })
      .catch(() => {
        console.log('Could not get silenced alerts');
        // Showing all alerts since we could not get silenced alerts list
        setSilencedAlerts([]);
      });
    return;
  }, []);

  let firingAlerts: Rule[] = [];
  if (silencedAlerts != null) {
    firingAlerts = alerts.filter(rule => !silencedAlerts.includes(rule.name));
  }
  return (
    <>
      <div className="netobserv-alerts-container">
        {firingAlerts.map(a => (
          <AlertBanner key={a.name} rule={a} onDelete={() => setAlerts(alerts.filter(alert => alert.name != a.name))} />
        ))}
      </div>
      {children ? children : ''}
    </>
  );
};

export default AlertFetcher;
