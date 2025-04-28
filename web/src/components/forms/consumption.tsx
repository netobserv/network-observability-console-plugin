import {
  K8sResourceKind,
  PrometheusEndpoint,
  PrometheusResponse,
  usePrometheusPoll
} from '@openshift-console/dynamic-plugin-sdk';
import { Flex, FlexItem, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { WarningTriangleIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import _ from 'lodash';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './forms.css';

export type ResourceCalculatorProps = {
  flowCollector: K8sResourceKind | null;
  setSampling?: (sampling: number) => void;
};

export const Consumption: FC<ResourceCalculatorProps> = ({ flowCollector, setSampling }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const [receivedPackets, rpLoaded, rpError] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: `sort_desc(sum(irate(container_network_receive_packets_total{cluster="",namespace=~".+"}[4h])) by (node,namespace,pod))`
  });

  const [transmittedPackets, tpLoaded, tpError] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: `sort_desc(sum(irate(container_network_transmit_packets_total{cluster="",namespace=~".+"}[4h])) by (node,namespace,pod))`
  });

  const getCurrentSampling = React.useCallback(() => {
    return flowCollector?.spec?.agent?.ebpf?.sampling || 50;
  }, [flowCollector?.spec?.agent?.ebpf?.sampling]);

  const getSamplings = React.useCallback(() => {
    const current = getCurrentSampling();
    let samplings = [1, 50, 100, 250];
    if (!samplings.includes(current)) {
      samplings.push(current);
      samplings = _.sortBy(samplings);
    }
    return samplings;
  }, [getCurrentSampling]);

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

  return (
    <Flex direction={{ default: 'column' }}>
      <FlexItem className="calculator-item">
        <Text component={TextVariants.h2}>{t('Cluster metrics')}</Text>
        <Table>
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
      <FlexItem>
        <Text component={TextVariants.h2}>{t('Estimation')}</Text>
        <Table>
          <Thead>
            <Tr>
              <Th>{t('Sampling')}</Th>
              <Th>{t('vCPU')}</Th>
              <Th>{t('Memory')}</Th>
              <Th>{t('Storage')}</Th>
              <Th>{t('Latency overhead')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {getSamplings().map((sampling, i) => {
              const current = getCurrentSampling() === sampling;
              return (
                <Tr
                  key={i}
                  isSelectable={setSampling !== undefined}
                  isClickable={setSampling !== undefined}
                  isRowSelected={current}
                  onClick={() => setSampling && setSampling(sampling)}
                >
                  <Td>{`${sampling} ${current ? t('(current)') : ''}`}</Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
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
