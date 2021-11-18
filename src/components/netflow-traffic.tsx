import * as React from 'react';
import * as _ from 'lodash';
import {
  useResolvedExtensions,
  isModelFeatureFlag,
  ModelFeatureFlag,
} from '@openshift-console/dynamic-plugin-sdk';

const NetflowTraffic: React.FC = () => {
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);

  return !_.isEmpty(extensions) ? (
    <div>
    </div>
  ) : null;
};


export default NetflowTraffic;
