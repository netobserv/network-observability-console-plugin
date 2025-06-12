import { FeatureFlagHandler, K8sResourceCommon, SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  PageSection,
  Spinner,
  Title
} from '@patternfly/react-core';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Config, defaultConfig } from '../model/config';
import { Filters } from '../model/filters';
import { loadConfig } from '../utils/config';
import { findFilter, getFilterDefinitions } from '../utils/filter-definitions';
import { usePrevious } from '../utils/previous-hook';
import Error from './messages/error';
import NetflowTrafficParent from './netflow-traffic-parent';

type NetflowTrafficTabProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  match?: {
    params?: {
      ns?: string;
    };
  };
  obj?: R;
  params?: {
    ns?: string;
  };
};

type RouteProps = K8sResourceCommon & {
  spec: {
    to: {
      kind?: string;
      name?: string;
    };
  };
};

type HPAProps = K8sResourceCommon & {
  spec: {
    scaleTargetRef: {
      kind?: string;
      name?: string;
    };
  };
};

export const NetflowTrafficTab: React.FC<NetflowTrafficTabProps> = ({ match, obj, params }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  //default to 800 to allow content to be rendered in tests
  const [containerHeight, setContainerHeight] = React.useState(800);
  const initState = React.useRef<
    Array<'initDone' | 'configLoading' | 'configLoaded' | 'configLoadError' | 'forcedFiltersLoaded'>
  >([]);
  const [config, setConfig] = React.useState<Config>(defaultConfig);
  const [error, setError] = React.useState<string | undefined>();
  const [forcedFilters, setForcedFilters] = React.useState<Filters>();
  const previous = usePrevious({ obj });

  React.useEffect(() => {
    // init function will be triggered only once
    if (!initState.current.includes('initDone')) {
      initState.current.push('initDone');

      // load config only once and track its state
      if (!initState.current.includes('configLoading')) {
        initState.current.push('configLoading');
        loadConfig().then(v => {
          setConfig(v.config);
          initState.current.push('configLoaded');
          if (v.error) {
            initState.current.push('configLoadError');
            setError(v.error);
          }
        });
      }
    }

    const container = document.getElementById('content-scrollable');
    if (container) {
      setContainerHeight(container.clientHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const filterDefinitions = getFilterDefinitions(config.filters, config.columns, t);

    if (
      !initState.current.includes('configLoaded') ||
      _.isEmpty(filterDefinitions) ||
      (initState.current.includes('forcedFiltersLoaded') &&
        obj?.kind === previous?.obj?.kind &&
        obj?.metadata?.name === previous?.obj?.metadata?.name &&
        obj?.metadata?.namespace === previous?.obj?.metadata?.namespace)
    ) {
      return;
    }

    initState.current.push('forcedFiltersLoaded');
    switch (obj?.kind) {
      case 'Pod':
      case 'Deployment':
      case 'StatefulSet':
      case 'DaemonSet':
      case 'Job':
      case 'CronJob':
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_resource')!,
              values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
            }
          ],
          match: 'peers'
        });
        break;
      case 'Service':
        // NOTE: Services are always on the destination side
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'dst_resource')!,
              values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
            }
          ],
          match: 'all'
        });
        break;
      case 'Gateway':
        // NOTE: Gateways can be both ingress (receive traffic) and egress (send traffic)
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_resource')!,
              values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
            }
          ],
          backAndForth: true
        });
        break;
      case 'Route':
        const route = obj as RouteProps;
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'dst_resource')!,
              values: [{ v: `${route.spec.to!.kind}.${route.metadata!.namespace}.${route.spec.to!.name}` }]
            }
          ],
          match: 'all'
        });
        break;
      case 'Namespace':
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_namespace')!,
              values: [{ v: obj!.metadata!.name as string }]
            }
          ],
          match: 'peers'
        });
        break;
      case 'Node':
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_host_name')!,
              values: [{ v: obj!.metadata!.name as string }]
            }
          ],
          match: 'peers'
        });
        break;
      case 'ReplicaSet':
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_resource')!,
              values: obj.metadata!.ownerReferences!.map(ownerRef => {
                return { v: `${ownerRef.kind}.${obj.metadata!.namespace}.${ownerRef.name}` };
              })
            }
          ],
          match: 'peers'
        });
        break;
      case 'HorizontalPodAutoscaler':
        const hpa = obj as HPAProps;
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_resource')!,
              values: [
                { v: `${hpa.spec.scaleTargetRef.kind}.${hpa.metadata!.namespace}.${hpa.spec.scaleTargetRef.name}` }
              ]
            }
          ],
          match: 'peers'
        });
        break;
    }
  }, [config, obj, previous, t]);

  if (error) {
    return <Error title={t('Unable to get config')} error={error} isLokiRelated={false} />;
  } else if (!initState.current.includes('forcedFiltersLoaded')) {
    return (
      <Bullseye data-test="loading-tab">
        <Spinner size="xl" />
      </Bullseye>
    );
  } else if (forcedFilters) {
    return (
      <div className="netobserv-tab-container" style={{ height: containerHeight - 190 }}>
        <NetflowTrafficParent
          forcedNamespace={params?.ns || match?.params?.ns}
          forcedFilters={forcedFilters}
          isTab={true}
          hideTitle={true}
          parentConfig={config}
        />
      </div>
    );
  } else {
    return (
      <PageSection id="pageSection" data-test="tab-page-section">
        <EmptyState data-test="error-state" variant={EmptyStateVariant.sm}>
          <Title headingLevel="h2" size="lg">
            {t('Kind not managed')}
          </Title>
          <EmptyStateBody>{obj?.kind}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }
};

export const featureFlagHandler: FeatureFlagHandler = (setFeatureFlag: SetFeatureFlag) => {
  loadConfig().then(({ config }) => {
    if (config) {
      const lokiEnabled = config.dataSources.some(ds => ds === 'loki');
      setFeatureFlag('NETOBSERV_LOKI_ENABLED', lokiEnabled);
    }
  });
};

export default NetflowTrafficTab;
