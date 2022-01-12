import { isModelFeatureFlag, ModelFeatureFlag, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { Button, PageSection, Tooltip } from '@patternfly/react-core';
import { ColumnsIcon, SyncAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Record } from '../api/loki';
import { getFlows } from '../api/routes';
import NetflowTable from './netflow-table/netflow-table';
import { Column, Filter, getDefaultColumns } from '../utils/columns';
import { usePoll } from '../utils/poll-hook';
import { ColumnsModal } from './columns-modal';
import { FiltersToolbar } from './filters-toolbar';
import './netflow-traffic.css';
import { RefreshDropdown } from './refresh-dropdown';
import TimeRangeDropdown from './time-range-dropdown';
import TimeRangeModal from './time-range-modal';
import { setQueryArguments, removeQueryArguments, getQueryArgument, getFiltersParams } from '../utils/router';
import { TimeRange } from '../utils/datetime';
import { usePrevious } from '../utils/previous-hook';

const DEFAULT_TIME_RANGE = 300000;

export const NetflowTraffic: React.FC = () => {
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  const [loading, setLoading] = React.useState(true);
  const [flows, setFlows] = React.useState<Record[]>([]);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isTRModalOpen, setTRModalOpen] = React.useState(false);
  const [isColModalOpen, setColModalOpen] = React.useState(false);
  const { t } = useTranslation('plugin__network-observability-plugin');

  //TODO: create a number range filter type for Packets & Bytes
  //TODO: set isSelected values from localstorage saved column ids
  const [columns, setColumns] = React.useState<Column[]>(getDefaultColumns(t));
  const [filters, setFilters] = React.useState<Filter[] | null>(null);
  const [range, setRange] = React.useState<number | TimeRange | null>(null);
  const previousRange = usePrevious<number | TimeRange | null>(range);
  const [interval, setInterval] = React.useState<number | null>(null);

  const tick = React.useCallback(() => {
    //skip tick while filters & range not initialized
    if (filters === null || range === null) {
      return;
    }
    setLoading(true);
    setError(undefined);
    getFlows(getFiltersParams(filters, range))
      .then(streams => {
        setFlows(streams);
      })
      .catch(err => {
        setFlows([]);
        let errorMessage = String(err);
        if (err?.response?.data) {
          Object.keys(err.response.data).forEach((key: string) => {
            errorMessage += `\n${key}: ${String(err.response.data[key])}`;
          });
        }
        setError(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters, range]);
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

  //update data on filters changes
  React.useEffect(() => {
    tick();
  }, [filters, tick]);

  //update data & arguments on range changes
  React.useEffect(() => {
    //ensure range is set and different than previous value
    if (range === null || range === previousRange) {
      return;
    }

    setTRModalOpen(false);
    if (typeof range === 'number') {
      setQueryArguments({ timeRange: range.toString() });
      removeQueryArguments(['startTime', 'endTime']);
    } else if (typeof range === 'object') {
      setQueryArguments({ startTime: range.from.toString(), endTime: range.to.toString() });
      removeQueryArguments(['timeRange']);
    } else {
      removeQueryArguments(['startTime', 'endTime', 'timeRange']);
    }
    tick();
  }, [previousRange, range, tick]);

  //apply range from query params at startup
  React.useEffect(() => {
    const timeRange = getQueryArgument('timeRange');
    const startTime = getQueryArgument('startTime');
    const endTime = getQueryArgument('endTime');
    if (timeRange && !isNaN(Number(timeRange))) {
      setRange(Number(timeRange));
    } else if ((startTime && !isNaN(Number(startTime))) || (endTime && !isNaN(Number(endTime)))) {
      setRange({ from: Number(startTime), to: Number(endTime) });
    } else {
      setRange(DEFAULT_TIME_RANGE);
    }
  }, []);

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection">
      <h1 className="co-m-pane__heading">
        <span>Network Traffic</span>
        <div className="co-actions">
          <TimeRangeDropdown
            id="time-range-dropdown"
            range={typeof range === 'number' ? range : null}
            setRange={setRange}
            openCustomModal={() => setTRModalOpen(true)}
          />
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
            onClick={() => setColModalOpen(true)}
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
        clearFilters={clearFilters}
        columns={columns.filter(col => col.isSelected)}
      />
      <TimeRangeModal
        id="time-range-modal"
        isModalOpen={isTRModalOpen}
        setModalOpen={setTRModalOpen}
        range={typeof range === 'object' ? range : null}
        setRange={setRange}
      />
      <ColumnsModal
        id="columns-modal"
        isModalOpen={isColModalOpen}
        setModalOpen={setColModalOpen}
        columns={columns}
        setColumns={setColumns}
      />
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
