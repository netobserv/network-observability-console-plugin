import { isModelFeatureFlag, ModelFeatureFlag, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  OverflowMenu,
  OverflowMenuGroup,
  OverflowMenuItem,
  PageSection,
  Text,
  TextVariants,
  ToggleGroup,
  ToggleGroupItem
} from '@patternfly/react-core';
import { ColumnsIcon, ExportIcon, SyncAltIcon, TableIcon, TopologyIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Record } from '../api/ipfix';
import { getFlows, getTopology } from '../api/routes';
import {
  Match,
  FlowQuery,
  Reporter,
  groupFiltersMatchAll,
  groupFiltersMatchAny,
  MetricFunction,
  MetricType
} from '../model/flow-query';
import { TopologyMetrics } from '../api/loki';
import { DefaultOptions, LayoutName, TopologyOptions } from '../model/topology';
import { Column, getDefaultColumns } from '../utils/columns';
import { TimeRange } from '../utils/datetime';
import { getHTTPErrorDetails } from '../utils/errors';
import { Feature, isAllowed } from '../utils/features-gate';
import { Filter } from '../model/filters';
import {
  LOCAL_STORAGE_COLS_KEY,
  LOCAL_STORAGE_REFRESH_KEY,
  LOCAL_STORAGE_SIZE_KEY,
  useLocalStorage
} from '../utils/local-storage-hook';
import { usePoll } from '../utils/poll-hook';
import {
  defaultMetricFunction,
  defaultMetricType,
  getFiltersFromURL,
  getLimitFromURL,
  getMatchFromURL,
  getRangeFromURL,
  getReporterFromURL,
  setURLFilters,
  setURLLimit,
  setURLMatch,
  setURLRange,
  setURLReporter,
  setURLMetricFunction,
  setURLMetricType
} from '../utils/router';
import DisplayDropdown, { Size } from './dropdowns/display-dropdown';
import MetricTypeDropdown from './dropdowns/metric-type-dropdown';
import MetricFunctionDropdown from './dropdowns/metric-function-dropdown';
import { RefreshDropdown } from './dropdowns/refresh-dropdown';
import TimeRangeDropdown from './dropdowns/time-range-dropdown';
import { FiltersToolbar } from './filters/filters-toolbar';
import QuerySummary from './query-summary/query-summary';
import { ColumnsModal } from './modals/columns-modal';
import { ExportModal } from './modals/export-modal';
import TimeRangeModal from './modals/time-range-modal';
import { RecordPanel } from './netflow-record/record-panel';
import NetflowTable from './netflow-table/netflow-table';
import NetflowTopology from './netflow-topology/netflow-topology';
import OptionsPanel from './netflow-topology/options-panel';
import { netflowTrafficPath, removeURLParam, URLParam } from '../utils/url';
import { loadConfig } from '../utils/config';
import SummaryPanel from './query-summary/summary-panel';

import './netflow-traffic.css';

export type ViewId = 'table' | 'topology';

// Note / improvment:
// Could also be loaded via an intermediate loader component
loadConfig();

export const NetflowTraffic: React.FC<{
  forcedFilters?: Filter[];
}> = ({ forcedFilters }) => {
  const { push } = useHistory();
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);

  const [loading, setLoading] = React.useState(true);
  const [flows, setFlows] = React.useState<Record[]>([]);
  const [layout, setLayout] = React.useState<LayoutName>(LayoutName.ColaNoForce);
  const [topologyOptions, setTopologyOptions] = React.useState<TopologyOptions>(DefaultOptions);
  const [metrics, setMetrics] = React.useState<TopologyMetrics[]>([]);
  const [isShowTopologyOptions, setShowTopologyOptions] = React.useState<boolean>(false);
  const [isShowQuerySummary, setShowQuerySummary] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [size, setSize] = useLocalStorage<Size>(LOCAL_STORAGE_SIZE_KEY, 'm');
  const [isTRModalOpen, setTRModalOpen] = React.useState(false);
  const [isColModalOpen, setColModalOpen] = React.useState(false);
  const [isExportModalOpen, setExportModalOpen] = React.useState(false);
  //TODO: move default view to an Overview like dashboard instead of table
  const [selectedViewId, setSelectedViewId] = React.useState<ViewId>('table');
  const [filters, setFilters] = React.useState<Filter[]>([]);
  const [match, setMatch] = React.useState<Match>(getMatchFromURL());
  const [reporter, setReporter] = React.useState<Reporter>(getReporterFromURL());
  const [limit, setLimit] = React.useState<number>(getLimitFromURL());
  const [range, setRange] = React.useState<number | TimeRange>(getRangeFromURL());
  const [metricFunction, setMetricFunction] = React.useState<MetricFunction>(defaultMetricFunction);
  const [metricType, setMetricType] = React.useState<MetricType | undefined>(defaultMetricType);
  const [interval, setInterval] = useLocalStorage<number | undefined>(LOCAL_STORAGE_REFRESH_KEY);
  const [selectedRecord, setSelectedRecord] = React.useState<Record | undefined>(undefined);

  const isInit = React.useRef(true);
  const [columns, setColumns] = useLocalStorage<Column[]>(LOCAL_STORAGE_COLS_KEY, getDefaultColumns(t), {
    id: 'id',
    criteria: 'isSelected'
  });

  React.useEffect(() => {
    // Init state from URL
    if (!forcedFilters) {
      getFiltersFromURL(t)?.then(setFilters);
    }
    // disabling exhaustive-deps: tests hang when "t" passed as dependency (useTranslation not stable?)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedFilters]);

  const onSelect = (record?: Record) => {
    setTRModalOpen(false);
    setColModalOpen(false);
    setSelectedRecord(record);
  };

  const buildFlowQuery = React.useCallback((): FlowQuery => {
    const f = forcedFilters || filters;
    const groupedFilters = match === 'any' ? groupFiltersMatchAny(f) : groupFiltersMatchAll(f);
    const query: FlowQuery = {
      filters: groupedFilters,
      limit: limit,
      reporter: reporter
    };
    if (range) {
      if (typeof range === 'number') {
        query.timeRange = range;
      } else if (typeof range === 'object') {
        query.startTime = range.from.toString();
        query.endTime = range.to.toString();
      }
    }
    if (selectedViewId === 'topology') {
      query.function = metricFunction;
      query.type = metricType;
    }
    return query;
  }, [forcedFilters, filters, match, limit, reporter, range, selectedViewId, metricFunction, metricType]);

  const tick = React.useCallback(() => {
    setLoading(true);
    setError(undefined);
    const fq = buildFlowQuery();
    switch (selectedViewId) {
      case 'table':
        getFlows(fq)
          .then(setFlows)
          .catch(err => {
            setFlows([]);
            setError(getHTTPErrorDetails(err));
          })
          .finally(() => {
            setLoading(false);
          });
        break;
      case 'topology':
        getTopology(fq)
          .then(setMetrics)
          .catch(err => {
            setMetrics([]);
            setError(getHTTPErrorDetails(err));
          })
          .finally(() => {
            setLoading(false);
          });
        break;
      default:
        console.error('tick called on not implemented view Id', selectedViewId);
        setLoading(false);
        break;
    }
  }, [buildFlowQuery, selectedViewId]);

  usePoll(tick, interval);

  // tick on state change
  React.useEffect(() => {
    // Skip on init if forcedFilters not set
    if (isInit.current) {
      isInit.current = false;
      if (!forcedFilters) {
        return;
      }
    }
    tick();
  }, [forcedFilters, tick]);

  // Rewrite URL params on state change
  React.useEffect(() => {
    setURLFilters(forcedFilters || filters);
  }, [filters, forcedFilters]);
  React.useEffect(() => {
    setURLRange(range);
  }, [range]);
  React.useEffect(() => {
    setURLLimit(limit);
  }, [limit]);
  React.useEffect(() => {
    setURLMatch(match);
  }, [match]);
  React.useEffect(() => {
    setURLReporter(reporter);
  }, [reporter]);
  React.useEffect(() => {
    setURLMetricFunction(metricFunction);
    if (metricFunction === 'rate') {
      setMetricType(undefined);
    } else if (!metricType) {
      setMetricType(defaultMetricType);
    }
  }, [metricFunction, metricType]);
  React.useEffect(() => {
    setURLMetricType(metricType);
  }, [metricType]);

  // updates table filters and clears up the table for proper visualization of the
  // updating process
  const updateTableFilters = (f: Filter[]) => {
    setFilters(f);
    setFlows([]);
  };

  const clearFilters = () => {
    if (forcedFilters) {
      push(netflowTrafficPath);
    } else if (filters) {
      removeURLParam(URLParam.Filters);
      updateTableFilters([]);
    }
  };

  const viewToggle = () => {
    return (
      isAllowed(Feature.Topology) && (
        <ToggleGroup>
          <ToggleGroupItem
            icon={<TableIcon />}
            text={t('Flow Table')}
            buttonId="tableViewButton"
            isSelected={selectedViewId === 'table'}
            onChange={() => setSelectedViewId('table')}
          />
          <ToggleGroupItem
            icon={<TopologyIcon />}
            text={t('Topology')}
            buttonId="topologyViewButton"
            isSelected={selectedViewId === 'topology'}
            onChange={() => setSelectedViewId('topology')}
          />
        </ToggleGroup>
      )
    );
  };

  const actions = () => {
    return (
      <div className="co-actions">
        {selectedViewId === 'topology' && (
          <MetricFunctionDropdown id="metricFunction" selected={metricFunction} setMetricFunction={setMetricFunction} />
        )}
        {selectedViewId === 'topology' && metricFunction !== 'rate' && (
          <MetricTypeDropdown id="metricType" selected={metricType} setMetricType={setMetricType} />
        )}
        <TimeRangeDropdown
          id="time-range-dropdown"
          range={typeof range === 'number' ? range : undefined}
          setRange={setRange}
          openCustomModal={() => setTRModalOpen(true)}
        />
        <RefreshDropdown
          id="refresh-dropdown"
          disabled={typeof range !== 'number'}
          interval={interval}
          setInterval={setInterval}
        />
        <Button
          id="refresh-button"
          className="co-action-refresh-button"
          variant="primary"
          onClick={() => tick()}
          icon={<SyncAltIcon style={{ animation: `spin ${loading ? 1 : 0}s linear infinite` }} />}
        />
      </div>
    );
  };

  const pageButtons = () => {
    switch (selectedViewId) {
      case 'table':
        return (
          <OverflowMenuGroup groupType="button" isPersistent>
            <OverflowMenuItem>
              <Button
                id="manage-columns-button"
                variant="link"
                className="overflow-button"
                icon={<ColumnsIcon />}
                onClick={() => setColModalOpen(true)}
              >
                {t('Manage columns')}
              </Button>
            </OverflowMenuItem>
            <OverflowMenuItem>
              <DisplayDropdown id="display" setSize={setSize} />
            </OverflowMenuItem>
            <OverflowMenuItem>
              <Button
                id="export-button"
                variant="link"
                className="overflow-button"
                icon={<ExportIcon />}
                onClick={() => setExportModalOpen(true)}
              >
                {t('Export')}
              </Button>
            </OverflowMenuItem>
          </OverflowMenuGroup>
        );
      default:
        return null;
    }
  };

  const panelContent = () => {
    if (selectedRecord) {
      return (
        <RecordPanel
          id="recordPanel"
          record={selectedRecord}
          columns={getDefaultColumns(t, false, false)}
          filters={filters}
          range={range}
          reporter={reporter}
          setFilters={setFilters}
          setRange={setRange}
          setReporter={setReporter}
          onClose={() => onSelect(undefined)}
        />
      );
    } else if (isShowTopologyOptions) {
      return (
        <OptionsPanel
          id="optionsPanel"
          layout={layout}
          setLayout={setLayout}
          options={topologyOptions}
          setOptions={setTopologyOptions}
          onClose={() => setShowTopologyOptions(false)}
        />
      );
    } else if (isShowQuerySummary) {
      return (
        //TODO: bind this panel to topology query after merge
        <SummaryPanel
          id="summaryPanel"
          flows={flows}
          range={range}
          limit={limit}
          onClose={() => setShowQuerySummary(false)}
        />
      );
    } else {
      return null;
    }
  };

  const pageContent = () => {
    switch (selectedViewId) {
      case 'table':
        return (
          <NetflowTable
            loading={loading}
            error={error}
            flows={flows}
            selectedRecord={selectedRecord}
            size={size}
            onSelect={onSelect}
            clearFilters={clearFilters}
            columns={columns.filter(col => col.isSelected)}
          />
        );
      case 'topology':
        return (
          <NetflowTopology
            loading={loading}
            error={error}
            range={range}
            metricFunction={metricFunction}
            metricType={metricType}
            match={match}
            limit={limit}
            metrics={metrics}
            layout={layout}
            options={topologyOptions}
            filters={filters}
            setFilters={setFilters}
            toggleTopologyOptions={() => setShowTopologyOptions(!isShowTopologyOptions)}
          />
        );
      default:
        return null;
    }
  };

  //update data on filters changes
  React.useEffect(() => {
    setTRModalOpen(false);
  }, [range]);

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection">
      {
        //display title only if forced filters is not set
        _.isEmpty(forcedFilters) && (
          <div id="pageHeader">
            <div className="flex">
              <Text component={TextVariants.h1}>{t('Network Traffic')}</Text>
            </div>
            {viewToggle()}
          </div>
        )
      }
      <FiltersToolbar
        id="filter-toolbar"
        filters={filters}
        setFilters={updateTableFilters}
        clearFilters={clearFilters}
        queryOptionsProps={{ limit, setLimit, match, setMatch, reporter, setReporter }}
        forcedFilters={forcedFilters}
        actions={actions()}
      >
        {
          <OverflowMenu breakpoint="md">
            {!_.isEmpty(forcedFilters) && viewToggle()}
            {pageButtons()}
          </OverflowMenu>
        }
      </FiltersToolbar>
      <Drawer
        id="drawer"
        isInline
        isExpanded={selectedRecord !== undefined || isShowTopologyOptions || isShowQuerySummary}
      >
        <DrawerContent id="drawerContent" panelContent={panelContent()}>
          <DrawerContentBody id="drawerBody">{pageContent()}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
      <QuerySummary
        flows={flows}
        range={range}
        limit={limit}
        toggleQuerySummary={() => setShowQuerySummary(!isShowQuerySummary)}
      />
      <TimeRangeModal
        id="time-range-modal"
        isModalOpen={isTRModalOpen}
        setModalOpen={setTRModalOpen}
        range={typeof range === 'object' ? range : undefined}
        setRange={setRange}
      />
      <ColumnsModal
        id="columns-modal"
        isModalOpen={isColModalOpen}
        setModalOpen={setColModalOpen}
        columns={columns}
        setColumns={setColumns}
      />
      <ExportModal
        id="export-modal"
        isModalOpen={isExportModalOpen}
        setModalOpen={setExportModalOpen}
        flowQuery={buildFlowQuery()}
        columns={columns.filter(c => c.fieldName)}
        range={range}
        filters={forcedFilters ? forcedFilters : filters}
      />
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
