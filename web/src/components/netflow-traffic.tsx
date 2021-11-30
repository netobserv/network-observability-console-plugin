import * as React from 'react';
import * as _ from 'lodash';
import {
  useResolvedExtensions,
  isModelFeatureFlag,
  ModelFeatureFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { getFlows } from '../api/routes';
import { ParsedStream } from '../api/loki';

const NetflowTraffic: React.FC = () => {
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  const [loading, setLoading] = React.useState(false);
  const [flows, setFlows] = React.useState<ParsedStream[]>([]);
  const [error, setError] = React.useState(undefined);

  React.useEffect(() => {
    setLoading(true);
    getFlows()
      .then(streams => {
        setFlows(streams);
        setError(undefined);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      })
  }, [false /*temp: no refresh*/]);

  return !_.isEmpty(extensions) ? (
    <div>
      <h2>Network Traffic</h2>
      {loading && <>Loading...</>}
      {error && (
        <div>Error: {error}</div>
      )}
      {flows.map((f, i) => (
        <ul key={i}>
          {f.values.map((v, i) => {
            return (
              <li key={i}>
                {v.blob}
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  ) : null;
};

export default NetflowTraffic;
