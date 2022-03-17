import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TableComposable, Tbody, InnerScrollContainer, OuterScrollContainer } from '@patternfly/react-table';
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
import { Size } from '../dropdowns/display-dropdown';

const NetflowTable: React.FC<{
  flows: Record[];
  selectedRecord?: Record;
  columns: Column[];
  size: Size;
  onSelect: (record?: Record) => void;
  clearFilters: () => void;
  loading?: boolean;
  error?: string;
}> = ({ flows, selectedRecord, columns, error, loading, size, onSelect, clearFilters }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  // index of the currently active column
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(-1);

  // sort direction of the currently active column
  const [activeSortDirection, setActiveSortDirection] = React.useState<string>('asc');

  const firstRender = React.useRef(true);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = firstRender.current && flows.length == 0;
      return;
    }
  }, [flows]);

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

  if (error) {
    return (
      <EmptyState data-test="error-state" variant={EmptyStateVariant.small}>
        <Title headingLevel="h2" size="lg">
          {t('Unable to get flows')}
        </Title>
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  } else if (_.isEmpty(flows)) {
    if (loading) {
      return (
        <Bullseye data-test="loading-contents">
          <Spinner size="xl" />
        </Bullseye>
      );
    } else {
      return (
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
      );
    }
  }

  const width = columns.reduce((prev, cur) => prev + cur.width, 0);
  if (width === 0) {
    return null;
  }

  return (
    <OuterScrollContainer>
      <InnerScrollContainer>
        <TableComposable aria-label="Netflow table" variant="compact" style={{ minWidth: `${width}em` }} isStickyHeader>
          <NetflowTableHeader
            onSort={onSort}
            sortDirection={activeSortDirection}
            sortIndex={activeSortIndex}
            columns={columns}
            tableWidth={width}
          />
          <Tbody>
            {getSortedFlows().map(f => (
              <NetflowTableRow
                key={f.key}
                flow={f}
                columns={columns}
                size={size}
                selectedRecord={selectedRecord}
                onSelect={onSelect}
                highlight={!firstRender.current}
              />
            ))}
          </Tbody>
        </TableComposable>
      </InnerScrollContainer>
    </OuterScrollContainer>
  );
};

export default NetflowTable;
