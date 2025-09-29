import {
  K8sResourceKind,
  PrometheusEndpoint,
  PrometheusResponse,
  usePrometheusPoll
} from '@openshift-console/dynamic-plugin-sdk';
import { Flex, FlexItem, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { WarningTriangleIcon } from '@patternfly/react-icons';
import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import _ from 'lodash';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './forms.css';

export type ResourceCalculatorProps = {
  flowCollector: K8sResourceKind | null;
  changedSampling: number | null;
  setChangedSampling: (sampling: number | null) => void;
};

export const Consumption: FC<ResourceCalculatorProps> = ({ flowCollector, changedSampling, setChangedSampling }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const [receivedPackets, rpLoaded, rpError] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: `sort_desc(sum(irate(container_network_receive_packets_total{cluster="",namespace=~".+"}[4h])) by (node,namespace,pod))`
  });

  const [transmittedPackets, tpLoaded, tpError] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: `sort_desc(sum(irate(container_network_transmit_packets_total{cluster="",namespace=~".+"}[4h])) by (node,namespace,pod))`
  });

  const getCRSampling = React.useCallback(() => {
    return (flowCollector?.spec?.agent?.ebpf?.sampling as number) || 50;
  }, [flowCollector?.spec?.agent?.ebpf?.sampling]);

  const getSamplings = React.useCallback(() => {
    const current = getCRSampling();
    let samplings = [1, 25, 50, 100, 125, 150];
    if (!samplings.includes(current)) {
      samplings.push(current);
      samplings = _.sortBy(samplings);
    }
    return samplings;
  }, [getCRSampling]);

  const loadingComponent = () => <Spinner size="lg" />;

  const errorComponent = () => <WarningTriangleIcon />;

  const value = (response?: PrometheusResponse) => {
    if (!response) {
      return 0;
    }
    return _.sumBy(response.data.result, r => Number(r.value![1]));
  };

  const labelsCount = React.useCallback(
    (label: string) => {
      if (!rpLoaded) {
        return loadingComponent();
      } else if (rpError) {
        return errorComponent();
      } else if (!receivedPackets) {
        return t('n/a');
      }
      return _.uniq(_.map(receivedPackets.data.result, r => r.metric[label])).length;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [receivedPackets, rpError, rpLoaded]
  );

  const getEstimation = React.useCallback(
    (sampling: number) => {
      // eslint-disable-next-line max-len
      // taken from https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/network_observability/configuring-network-observability-operators#network-observability-total-resource-usage-table_network_observability

      // TODO: rely on more than nodes here
      const nodes = labelsCount('node');
      const estimatedCPU = nodes <= 25 ? -0.0096 * sampling + 1.8296 : -0.1347 * sampling + 12.1247;
      const estimatedMemory = nodes <= 25 ? -0.1224 * sampling + 22.1224 : -0.4898 * sampling + 87.4898;
      return {
        cpu: estimatedCPU > 0 ? estimatedCPU.toFixed(2) : '< 0.1',
        memory: estimatedMemory > 0 ? estimatedMemory.toFixed(0) : '< 1'
      };
    },
    [labelsCount]
  );

  const getRecommendations = React.useCallback(() => {
    // eslint-disable-next-line max-len
    // taken from https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/network_observability/configuring-network-observability-operators
    const nodes = labelsCount('node');
    return [
      {
        cpu: nodes <= 10 ? 4 : 16,
        memory: nodes <= 10 ? 16 : 64,
        lokistackSize: nodes <= 10 ? '1x.extra-small' : nodes <= 25 ? '1x.small' : '1x.medium',
        kafka: nodes <= 25 ? '6 consumers' : '18 consumers'
      }
    ];
  }, [labelsCount]);

  const initialSampling = getCRSampling();
  const currentSampling = changedSampling !== null ? changedSampling : initialSampling;

  return (
    <Flex direction={{ default: 'column' }}>
      <FlexItem className="calculator-item">
        <Text component={TextVariants.h2}>{t('Cluster metrics')}</Text>
        <Table variant={TableVariant.compact}>
          <Thead>
            <Tr>
              <Th>{t('Bandwidth')}</Th>
              <Th>{t('Nodes')}</Th>
              <Th>{t('Namespaces')}</Th>
              <Th>{t('Pods')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>
                {!rpLoaded || !tpLoaded
                  ? loadingComponent()
                  : rpError || tpError
                  ? errorComponent()
                  : `${Math.round(value(receivedPackets) + value(transmittedPackets))} pps`}
              </Td>
              <Td>{labelsCount('node')}</Td>
              <Td>{labelsCount('namespace')}</Td>
              <Td>{labelsCount('pod')}</Td>
            </Tr>
          </Tbody>
        </Table>
      </FlexItem>
      <FlexItem className="calculator-item">
        <Text component={TextVariants.h2}>{t('Recommendations')}</Text>
        <span className="co-pre-line">
          {t(
            // eslint-disable-next-line max-len
            'The example outlined in the table demonstrates a scenario that is tailored to your workload. Consider this example only as a baseline from which adjustments can be made to accommodate your needs.'
          )}
        </span>
        <Table variant={TableVariant.compact}>
          <Thead>
            <Tr>
              <Th>{t('vCPU')}</Th>
              <Th>{t('Memory')}</Th>
              <Th>{t('LokiStack size')}</Th>
              <Th>{t('Kafka')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {getRecommendations().map((reco, i) => {
              return (
                <Tr key={i}>
                  <Td>{`${reco.cpu}vCPUs`}</Td>
                  <Td>{`${reco.memory}GiB`}</Td>
                  <Td>{reco.lokistackSize}</Td>
                  <Td>{reco.kafka}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </FlexItem>
      <FlexItem>
        <Text component={TextVariants.h2}>{t('Estimation')}</Text>
        <span className="co-pre-line">
          {t(
            // eslint-disable-next-line max-len
            'The estimations are based on the number of nodes in the cluster and the sampling rate. They do not take into account the number of namespaces or pods, as their impact is comparatively lower than that of nodes.\nThe estimations are calculated using a linear regression model based on data collected from various OpenShift clusters. Actual resource consumption may vary depending on your specific workload and cluster configuration.\n\nTo change the sampling rate, select a row in the table below.'
          )}
        </span>
        <Table variant={TableVariant.compact}>
          <Thead>
            <Tr>
              <Th>{t('Sampling')}</Th>
              <Th>{t('vCPU')}</Th>
              <Th>{t('Memory')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {getSamplings().map((sampling, i) => {
              const isCurrent = currentSampling === sampling;
              let extraText = '';
              if (isCurrent) {
                extraText = changedSampling === null ? t('(current)') : t('(new value)');
              } else if (sampling === initialSampling) {
                extraText = t('(previous value)');
              }
              const estimate = getEstimation(sampling);
              return (
                <Tr
                  key={i}
                  isSelectable
                  isClickable
                  isRowSelected={isCurrent}
                  onClick={() => setChangedSampling(sampling === initialSampling ? null : sampling)}
                >
                  <Td>{`${sampling} ${extraText}`}</Td>
                  <Td>{`${estimate.cpu}vCPUs`}</Td>
                  <Td>{`${estimate.memory}GiB`}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </FlexItem>
    </Flex>
  );
};

export default Consumption;
