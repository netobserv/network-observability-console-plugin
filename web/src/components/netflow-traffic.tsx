import { isModelFeatureFlag, ModelFeatureFlag, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { Button, PageSection, Tooltip } from '@patternfly/react-core';
import { ColumnsIcon, SyncAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ParsedStream } from '../api/loki';
import { getFlows } from '../api/routes';
import { Column, Filter, getDefaultColumns } from '../utils/columns';
import { usePoll } from '../utils/poll-hook';
import { ColumnsModal } from './columns-modal';
import { FiltersToolbar } from './filters-toolbar';
import NetflowTable from './netflow-table';
import './netflow-traffic.css';
import { RefreshDropdown } from './refresh-dropdown';
import { removeQueryArguments } from '../utils/router';

export const NetflowTraffic: React.FC = () => {
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  const [loading, setLoading] = React.useState(true);
  const [flows, setFlows] = React.useState<ParsedStream[]>([]);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const { t } = useTranslation('plugin__network-observability-plugin');

  //TODO: create a number range filter type for Packets & Bytes
  //TODO: set isSelected values from localstorage saved column ids
  const [columns, setColumns] = React.useState<Column[]>(getDefaultColumns(t));
  const [filters, setFilters] = React.useState<Filter[] | null>(null);
  const [interval, setInterval] = React.useState<number | null>(null);
  const tick = React.useCallback(() => {
    //skip tick while filters not initialized
    if (filters === null) {
      return;
    }
    setLoading(true);
    setError(undefined);
    getFlows(filters)
      .then(streams => {
        setFlows(streams);
        setLoading(false);
      })
      .catch(err => {
        setFlows([]);
        setError(String(err));
        setLoading(false);
      });
  }, [filters]);
  usePoll(tick, interval);

  // updates table filters and clears up the table for proper visualization of the
  // updating process
  const updateTableFilters = (f: Filter[]) => {
    setFilters(f);
    setFlows([]);
    setLoading(true);
  };

  const clearFilters = () => {
    if (!_.isEmpty(filters)) {
      removeQueryArguments(filters.map(f => f.colId));
    }
    updateTableFilters([]);
  };

  React.useEffect(() => {
    tick();
  }, [filters, tick]);

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection">
      <h1 className="co-m-pane__heading">
        <span>Network Traffic</span>
        <div className="co-actions">
          <RefreshDropdown id="refresh-dropdown" interval={interval} setInterval={setInterval} />
          <Button
            id="refresh-button"
            className="co-action-refresh-button"
            variant="primary"
            onClick={() => tick()}
            icon={<SyncAltIcon style={{ animation: `spin ${loading ? 1 : 0}s linear infinite` }} />}
          />
        </div>
      </h1>
      <FiltersToolbar
        id="filter-toolbar"
        columns={columns}
        filters={filters}
        setFilters={updateTableFilters}
        clearFilters={clearFilters}
      >
        <Tooltip content={t('Manage columns')}>
          <Button
            id="manage-columns-button"
            variant="plain"
            onClick={() => setModalOpen(true)}
            aria-label={t('Column management')}
          >
            <ColumnsIcon color="#6A6E73" />
          </Button>
        </Tooltip>
      </FiltersToolbar>
      <NetflowTable
        loading={loading}
        error={error}
        flows={flows}
        setFlows={setFlows}
        clearFilters={clearFilters}
        columns={columns.filter(col => col.isSelected)}
      />
      <ColumnsModal
        id="columns-modal"
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        columns={columns}
        setColumns={setColumns}
      />
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
