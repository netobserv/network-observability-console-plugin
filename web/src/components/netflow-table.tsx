import * as React from 'react';
import { TableComposable, Tbody, Td, Tr } from '@patternfly/react-table';
import { ParsedStream } from '../api/loki';
import { NetflowTableHeader } from './netflow-table-header';
import NetflowTableRow from './netflow-table-row';
import * as _ from 'lodash';
import protocols from 'protocol-numbers';
import { ipCompare } from '../utils/ip';
import { comparePort } from '../utils/port';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Title
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Column, ColumnsId } from '../utils/columns';

const NetflowTable: React.FC<{
  flows: ParsedStream[];
  setFlows: React.Dispatch<React.SetStateAction<ParsedStream[]>>;
  columns: Column[];
  clearFilters: () => void;
  loading?: boolean;
  error?: string;
}> = ({ flows, setFlows, columns, error, loading, clearFilters }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  // index of the currently active column
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(-1);

  // sort direction of the currently active column
  const [activeSortDirection, setActiveSortDirection] = React.useState<string>('asc');

  //Sort handler
  const onSort = (event: React.MouseEvent, index: number, direction: string) => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
    // sorts the rows
    const updatedFlows = flows.sort((a, b): number => {
      let flow1: ParsedStream;
      let flow2: ParsedStream;
      if (direction === 'desc') {
        flow1 = a;
        flow2 = b;
      } else {
        flow1 = b;
        flow2 = a;
      }
      switch (columns[index].id) {
        case ColumnsId.timestamp: {
          return flow1.value.timestamp - flow2.value.timestamp;
        }
        case ColumnsId.srcpod: {
          const flow1PodName = flow1.value.IPFIX.SrcPod ? flow1.value.IPFIX.SrcPod : '';
          const flow2PodName = flow2.value.IPFIX.SrcPod ? flow2.value.IPFIX.SrcPod : '';
          return flow1PodName.localeCompare(flow2PodName);
        }
        case ColumnsId.dstpod: {
          const flow1PodName = flow1.value.IPFIX.DstPod ? flow1.value.IPFIX.DstPod : '';
          const flow2PodName = flow2.value.IPFIX.DstPod ? flow2.value.IPFIX.DstPod : '';
          return flow1PodName.localeCompare(flow2PodName);
        }
        case ColumnsId.srcnamespace: {
          const flow1NsName = flow1.labels['SrcNamespace'] ? flow1.labels['SrcNamespace'] : '';
          const flow2NsName = flow2.labels['SrcNamespace'] ? flow2.labels['SrcNamespace'] : '';
          return flow1NsName.localeCompare(flow2NsName);
        }
        case ColumnsId.dstnamespace: {
          const flow1NsName = flow1.labels['DstNamespace'] ? flow1.labels['DstNamespace'] : '';
          const flow2NsName = flow2.labels['DstNamespace'] ? flow2.labels['DstNamespace'] : '';
          return flow1NsName.localeCompare(flow2NsName);
        }
        case ColumnsId.srcport: {
          return comparePort(flow1.value.IPFIX.SrcPort, flow2.value.IPFIX.SrcPort);
        }
        case ColumnsId.dstport: {
          return comparePort(flow1.value.IPFIX.DstPort, flow2.value.IPFIX.DstPort);
        }
        case ColumnsId.srcaddr: {
          return ipCompare(flow1.value.IPFIX.SrcAddr, flow2.value.IPFIX.SrcAddr);
        }
        case ColumnsId.dstaddr: {
          return ipCompare(flow1.value.IPFIX.DstAddr, flow2.value.IPFIX.DstAddr);
        }
        case ColumnsId.proto: {
          return protocols[flow1.value.IPFIX.Proto].name.localeCompare(protocols[flow2.value.IPFIX.Proto].name);
        }
        case ColumnsId.bytes: {
          return flow1.value.IPFIX.Bytes - flow2.value.IPFIX.Bytes;
        }
        case ColumnsId.packets: {
          return flow1.value.IPFIX.Packets - flow2.value.IPFIX.Packets;
        }
      }
      console.log('Unknown column');
      return 0;
    });
    setFlows(updatedFlows);
  };

  let bodyContent;
  if (error) {
    bodyContent = (
      <Tr>
        <Td colSpan={columns.length}>
          <EmptyState data-test="error-state" variant={EmptyStateVariant.small}>
            <Title headingLevel="h2" size="lg">
              {t('Unable to get flows')}
            </Title>
            <EmptyStateBody>{error}</EmptyStateBody>
          </EmptyState>
        </Td>
      </Tr>
    );
  } else if (_.isEmpty(flows)) {
    if (loading) {
      bodyContent = (
        <Tr>
          <Td colSpan={columns.length}>
            <Bullseye data-test="loading-contents">
              <Spinner size="xl" />
            </Bullseye>
          </Td>
        </Tr>
      );
    } else {
      bodyContent = (
        <Tr>
          <Td colSpan={columns.length}>
            <Bullseye data-test="no-results-found">
              <EmptyState variant={EmptyStateVariant.small}>
                <EmptyStateIcon icon={SearchIcon} />
                <Title headingLevel="h2" size="lg">
                  {t('No results found')}
                </Title>
                <EmptyStateBody>{t('Clear all filters and try again.')}</EmptyStateBody>
                <Button data-test="clear-all-filters" variant="link" onClick={clearFilters}>
                  {t('Clear all filters')}
                </Button>
              </EmptyState>
            </Bullseye>
          </Td>
        </Tr>
      );
    }
  } else {
    bodyContent = flows.map((f, i) => <NetflowTableRow key={i} flow={f} columns={columns} />);
  }

  return (
    <TableComposable aria-label="Misc table" variant="compact">
      <NetflowTableHeader
        onSort={onSort}
        sortDirection={activeSortDirection}
        sortIndex={activeSortIndex}
        columns={columns}
      />
      <Tbody>{bodyContent}</Tbody>
    </TableComposable>
  );
};

export default NetflowTable;
