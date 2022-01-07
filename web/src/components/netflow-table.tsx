import * as React from 'react';
import { TableComposable, Tbody, Td, Tr } from '@patternfly/react-table';
import { ParsedStream } from '../api/loki';
import { NetflowTableHeader } from './netflow-table-header';
import NetflowTableRow from './netflow-table-row';
import * as _ from 'lodash';
import protocols from 'protocol-numbers';
import { ipCompare } from '../utils/ip';
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
import { Column, ColumnsId, getFlowValueFromColumnId } from '../utils/columns';
import { comparePort } from '../utils/port';

const NetflowTable: React.FC<{
  flows: ParsedStream[];
  columns: Column[];
  clearFilters: () => void;
  loading?: boolean;
  error?: string;
}> = ({ flows, columns, error, loading, clearFilters }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  // index of the currently active column
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(-1);

  // sort direction of the currently active column
  const [activeSortDirection, setActiveSortDirection] = React.useState<string>('asc');

  // sort function
  const getSortedFlows = () => {
    if (activeSortIndex < 0 || activeSortIndex >= columns.length) {
      return flows;
    } else {
      return flows.sort((a, b): number => {
        const isDesc = activeSortDirection === 'desc';
        const f1Value = getFlowValueFromColumnId(isDesc ? a : b, columns[activeSortIndex].id);
        const f2Value = getFlowValueFromColumnId(isDesc ? b : a, columns[activeSortIndex].id);
        switch (columns[activeSortIndex].id) {
          case ColumnsId.srcport:
          case ColumnsId.dstport: {
            return comparePort(f1Value, f2Value);
          }
          case ColumnsId.srcaddr:
          case ColumnsId.dstaddr: {
            return ipCompare(f1Value as string, f2Value as string);
          }
          case ColumnsId.proto: {
            return protocols[f1Value].name.localeCompare(protocols[f2Value].name);
          }
          default: {
            //at least one value must be set, else we can't sort
            if (f1Value != null || f2Value != null) {
              if (typeof f1Value == 'string' || typeof f2Value == 'string') {
                return String(f1Value).localeCompare(String(f2Value));
              } else if (typeof f1Value == 'number' || typeof f2Value == 'number') {
                return Number(f1Value) - Number(f2Value);
              } else {
                console.error("can't sort values", f1Value, f2Value, typeof f1Value, typeof f2Value);
              }
            }
          }
        }
        return 0;
      });
    }
  };

  // sort handler
  const onSort = (event: React.MouseEvent, index: number, direction: string) => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
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
    bodyContent = getSortedFlows().map((f, i) => <NetflowTableRow key={i} flow={f} columns={columns} />);
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
