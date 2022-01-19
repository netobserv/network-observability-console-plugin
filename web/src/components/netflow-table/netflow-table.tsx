import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TableComposable, Tbody, Td, Tr } from '@patternfly/react-table';
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
import { SearchIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';

import { Record } from '../../api/ipfix';
import { NetflowTableHeader } from './netflow-table-header';
import NetflowTableRow from './netflow-table-row';
import { Column } from '../../utils/columns';
import { Size } from '../display-dropdown';

const NetflowTable: React.FC<{
  flows: Record[];
  columns: Column[];
  size: Size;
  clearFilters: () => void;
  loading?: boolean;
  error?: string;
}> = ({ flows, columns, error, loading, size, clearFilters }) => {
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
      return flows.sort((a: Record, b: Record) => {
        const col = columns[activeSortIndex];
        return activeSortDirection === 'desc' ? col.sort(a, b, col) : col.sort(b, a, col);
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
    bodyContent = getSortedFlows().map(f => <NetflowTableRow key={f.key} flow={f} columns={columns} size={size} />);
  }

  const width = columns.reduce((prev, cur) => prev + cur.width, 0);
  if (width === 0) {
    return null;
  }

  return (
    <TableComposable aria-label="Misc table" variant="compact" style={{ minWidth: `${width}em` }}>
      <NetflowTableHeader
        onSort={onSort}
        sortDirection={activeSortDirection}
        sortIndex={activeSortIndex}
        columns={columns}
        tableWidth={width}
      />
      <Tbody>{bodyContent}</Tbody>
    </TableComposable>
  );
};

export default NetflowTable;
