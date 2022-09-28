import { isModelFeatureFlag, ModelFeatureFlag, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertActionCloseButton,
  Button,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  Flex,
  FlexItem,
  OverflowMenuItem,
  PageSection,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextVariants
} from '@patternfly/react-core';
import { ColumnsIcon, CompressIcon, EllipsisVIcon, ExpandIcon, ExportIcon, SyncAltIcon } from '@patternfly/react-icons';
import { GraphElement } from '@patternfly/react-topology';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Record } from '../api/ipfix';
import { Stats, TopologyMetrics } from '../api/loki';
import { getFlows, getTopology } from '../api/routes';
import {
  DisabledFilters,
  Filter,
  getDisabledFiltersRecord,
  getEnabledFilters,
  hasIndexFields,
  hasNonIndexFields
} from '../model/filters';
import {
  FlowQuery,
  groupFiltersMatchAll,
  groupFiltersMatchAny,
  Layer,
  Match,
  MetricFunction,
  MetricScope,
  MetricType,
  Reporter
} from '../model/flow-query';
import { DefaultOptions, TopologyGroupTypes, TopologyOptions } from '../model/topology';
import { Column, getDefaultColumns } from '../utils/columns';
import { loadConfig } from '../utils/config';
import { ContextSingleton } from '../utils/context';
import { TimeRange } from '../utils/datetime';
import { getHTTPErrorDetails } from '../utils/errors';
import { Feature, isAllowed } from '../utils/features-gate';
import { useK8sModelsWithColors } from '../utils/k8s-models-hook';
import {
  LOCAL_STORAGE_COLS_KEY,
  LOCAL_STORAGE_DISABLED_FILTERS_KEY,
  LOCAL_STORAGE_LAST_LIMIT_KEY,
  LOCAL_STORAGE_LAST_TOP_KEY,
  LOCAL_STORAGE_METRIC_FUNCTION_KEY,
  LOCAL_STORAGE_METRIC_SCOPE_KEY,
  LOCAL_STORAGE_METRIC_TYPE_KEY,
  LOCAL_STORAGE_OVERVIEW_IDS_KEY,
  LOCAL_STORAGE_QUERY_PARAMS_KEY,
  LOCAL_STORAGE_REFRESH_KEY,
  LOCAL_STORAGE_SIZE_KEY,
  LOCAL_STORAGE_TOPOLOGY_OPTIONS_KEY,
  LOCAL_STORAGE_VIEW_ID_KEY,
  useLocalStorage
} from '../utils/local-storage-hook';
import { getDefaultOverviewPanels, OverviewPanel } from '../utils/overview-panels';
import { usePoll } from '../utils/poll-hook';
import {
  defaultMetricFunction,
  defaultMetricType,
  getFiltersFromURL,
  getLayerFromURL,
  getLimitFromURL,
  getMatchFromURL,
  getRangeFromURL,
  getReporterFromURL,
  setURLFilters,
  setURLLayer,
  setURLLimit,
  setURLMatch,
  setURLMetricFunction,
  setURLMetricType,
  setURLRange,
  setURLReporter
} from '../utils/router';
import { getURLParams, hasEmptyParams, netflowTrafficPath, removeURLParam, setURLParams, URLParam } from '../utils/url';
import DisplayDropdown, { Size } from './dropdowns/display-dropdown';
import MetricFunctionDropdown from './dropdowns/metric-function-dropdown';
import MetricTypeDropdown from './dropdowns/metric-type-dropdown';
import { LIMIT_VALUES, TOP_VALUES } from './dropdowns/query-options-dropdown';
import { RefreshDropdown } from './dropdowns/refresh-dropdown';
import ScopeDropdown from './dropdowns/scope-dropdown';
import TimeRangeDropdown from './dropdowns/time-range-dropdown';
import { FiltersToolbar } from './filters/filters-toolbar';
import { ColumnsModal } from './modals/columns-modal';
import { ExportModal } from './modals/export-modal';
import OverviewPanelsModal from './modals/overview-panels-modal';
import TimeRangeModal from './modals/time-range-modal';
import NetflowOverview from './netflow-overview/netflow-overview';
import { RecordPanel } from './netflow-record/record-panel';
import NetflowTable from './netflow-table/netflow-table';
import ElementPanel from './netflow-topology/element-panel';
import NetflowTopology from './netflow-topology/netflow-topology';
import OptionsPanel from './netflow-topology/options-panel';
import './netflow-traffic.css';
import QuerySummary from './query-summary/query-summary';
import SummaryPanel from './query-summary/summary-panel';

export type ViewId = 'overview' | 'table' | 'topology';

// Note / improvment:
// Could also be loaded via an intermediate loader component
loadConfig();

export const NetflowTraffic: React.FC<{
  forcedFilters?: Filter[];
  isTab?: boolean;
}> = ({ forcedFilters, isTab }) => {
  const { push } = useHistory();
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  const k8sModels = useK8sModelsWithColors();
  //set context from extensions. Standalone will return a "dummy" flag
  ContextSingleton.setContext(extensions);
  const [queryParams, setQueryParams] = useLocalStorage<string>(LOCAL_STORAGE_QUERY_PARAMS_KEY);
  const [disabledFilters, setDisabledFilters] = useLocalStorage<DisabledFilters>(LOCAL_STORAGE_DISABLED_FILTERS_KEY);
  // set url params from local storage saved items at startup if empty
  if (hasEmptyParams() && queryParams) {
    setURLParams(queryParams);
  }

  const warningTimeOut = React.useRef<NodeJS.Timeout | undefined>();
  const [warningMessage, setWarningMessage] = React.useState<string | undefined>();
  const [isOverflowMenuOpen, setOverflowMenuOpen] = React.useState(false);
  const [isFullScreen, setFullScreen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [flows, setFlows] = React.useState<Record[]>([]);
  const [stats, setStats] = React.useState<Stats | undefined>(undefined);
  const [topologyOptions, setTopologyOptions] = useLocalStorage<TopologyOptions>(
    LOCAL_STORAGE_TOPOLOGY_OPTIONS_KEY,
    DefaultOptions
  );
  const [metrics, setMetrics] = React.useState<TopologyMetrics[]>([]);
  const [isShowTopologyOptions, setShowTopologyOptions] = React.useState<boolean>(false);
  const [isShowQuerySummary, setShowQuerySummary] = React.useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = React.useState<Date | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>();
  const [size, setSize] = useLocalStorage<Size>(LOCAL_STORAGE_SIZE_KEY, 'm');
  const [isTRModalOpen, setTRModalOpen] = React.useState(false);
  const [isOverviewModalOpen, setOverviewModalOpen] = React.useState(false);
  const [isColModalOpen, setColModalOpen] = React.useState(false);
  const [isExportModalOpen, setExportModalOpen] = React.useState(false);
  const [selectedViewId, setSelectedViewId] = useLocalStorage<ViewId>(
    LOCAL_STORAGE_VIEW_ID_KEY,
    isAllowed(Feature.Overview) ? 'overview' : 'table'
  );
  const [filters, setFilters] = React.useState<Filter[]>([]);
  const [match, setMatch] = React.useState<Match>(getMatchFromURL());
  const [reporter, setReporter] = React.useState<Reporter>(getReporterFromURL());
  const [layer, setLayer] = React.useState<Layer>(getLayerFromURL());
  const [limit, setLimit] = React.useState<number>(getLimitFromURL());
  const [lastLimit, setLastLimit] = useLocalStorage<number>(LOCAL_STORAGE_LAST_LIMIT_KEY, LIMIT_VALUES[0]);
  const [lastTop, setLastTop] = useLocalStorage<number>(LOCAL_STORAGE_LAST_TOP_KEY, TOP_VALUES[0]);
  const [range, setRange] = React.useState<number | TimeRange>(getRangeFromURL());
  const [metricScope, setMetricScope] = useLocalStorage<MetricScope>(LOCAL_STORAGE_METRIC_SCOPE_KEY, 'namespace');
  const [metricFunction, setMetricFunction] = useLocalStorage<MetricFunction>(
    LOCAL_STORAGE_METRIC_FUNCTION_KEY,
    defaultMetricFunction
  );
  const [metricType, setMetricType] = useLocalStorage<MetricType | undefined>(
    LOCAL_STORAGE_METRIC_TYPE_KEY,
    defaultMetricType
  );
  const [interval, setInterval] = useLocalStorage<number | undefined>(LOCAL_STORAGE_REFRESH_KEY);
  const [selectedRecord, setSelectedRecord] = React.useState<Record | undefined>(undefined);
  const [selectedElement, setSelectedElement] = React.useState<GraphElement | undefined>(undefined);

  const isInit = React.useRef(true);
  const [panels, setSelectedPanels] = useLocalStorage<OverviewPanel[]>(
    LOCAL_STORAGE_OVERVIEW_IDS_KEY,
    getDefaultOverviewPanels(t),
    {
      id: 'id',
      criteria: 'isSelected'
    }
  );
  const [columns, setColumns] = useLocalStorage<Column[]>(LOCAL_STORAGE_COLS_KEY, getDefaultColumns(t), {
    id: 'id',
    criteria: 'isSelected'
  });

  React.useEffect(() => {
    // Init state from URL
    if (!forcedFilters) {
      getFiltersFromURL(t, disabledFilters)?.then(updateTableFilters);
    }
    // disabling exhaustive-deps: tests hang when "t" passed as dependency (useTranslation not stable?)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedFilters]);

  const clearSelections = () => {
    setTRModalOpen(false);
    setOverviewModalOpen(false);
    setColModalOpen(false);
    setSelectedRecord(undefined);
    setShowTopologyOptions(false);
    setShowQuerySummary(false);
    setSelectedElement(undefined);
  };

  const selectView = (view: ViewId) => {
    clearSelections();
    //reporter 'both' is disabled for topology view
    if (view === 'topology' && reporter === 'both') {
      setReporter('source');
    }
    //save / restore top / limit parameter according to selected view
    if (view === 'overview' && selectedViewId !== 'overview') {
      setLastLimit(limit);
      setLimit(lastTop);
    } else if (view !== 'overview' && selectedViewId === 'overview') {
      setLastTop(limit);
      setLimit(lastLimit);
    }
    setSelectedViewId(view);
  };

  const onRecordSelect = (record?: Record) => {
    clearSelections();
    setSelectedRecord(record);
  };

  const onElementSelect = (element?: GraphElement) => {
    clearSelections();
    setSelectedElement(element);
  };

  const onToggleTopologyOptions = (v: boolean) => {
    clearSelections();
    setShowTopologyOptions(v);
  };

  const onToggleQuerySummary = (v: boolean) => {
    clearSelections();
    setShowQuerySummary(v);
  };

  const buildFlowQuery = React.useCallback((): FlowQuery => {
    const enabledFilters = getEnabledFilters(forcedFilters || filters);
    const groupedFilters =
      match === 'any' ? groupFiltersMatchAny(enabledFilters) : groupFiltersMatchAll(enabledFilters);
    const query: FlowQuery = {
      filters: groupedFilters,
      limit: limit,
      reporter: reporter,
      layer: layer
    };
    if (range) {
      if (typeof range === 'number') {
        query.timeRange = range;
      } else if (typeof range === 'object') {
        query.startTime = range.from.toString();
        query.endTime = range.to.toString();
      }
    }
    if (selectedViewId !== 'table') {
      query.function = metricFunction;
      query.type = metricType;
      query.scope = metricScope;
      if (selectedViewId === 'topology') {
        query.groups = topologyOptions.groupTypes !== TopologyGroupTypes.NONE ? topologyOptions.groupTypes : undefined;
      }
    }
    return query;
  }, [
    forcedFilters,
    filters,
    match,
    limit,
    reporter,
    layer,
    range,
    selectedViewId,
    metricFunction,
    metricType,
    metricScope,
    topologyOptions.groupTypes
  ]);

  const manageWarnings = React.useCallback(
    (query: Promise<unknown>) => {
      Promise.race([query, new Promise((resolve, reject) => setTimeout(reject, 2000, 'slow'))]).then(
        null,
        (reason: string) => {
          if (reason === 'slow') {
            setWarningMessage(`${t('Query is slow')}`);
          }
        }
      );
    },
    // i18n t dependency kills jest
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const tick = React.useCallback(() => {
    setLoading(true);
    setError(undefined);
    const fq = buildFlowQuery();
    switch (selectedViewId) {
      case 'table':
        manageWarnings(
          getFlows(fq)
            .then(result => {
              setFlows(result.records);
              setStats(result.stats);
              setLastRefresh(new Date());
            })
            .catch(err => {
              setFlows([]);
              setError(getHTTPErrorDetails(err));
              setLastRefresh(new Date());
              setWarningMessage(undefined);
            })
            .finally(() => {
              setLoading(false);
            })
        );
        break;
      case 'overview':
      case 'topology':
        manageWarnings(
          getTopology(fq, range)
            .then(result => {
              setMetrics(result.metrics);
              setStats(result.stats);
            })
            .catch(err => {
              setMetrics([]);
              setError(getHTTPErrorDetails(err));
              setWarningMessage(undefined);
            })
            .finally(() => {
              setLoading(false);
            })
        );
        break;
      default:
        console.error('tick called on not implemented view Id', selectedViewId);
        setLoading(false);
        break;
    }
  }, [buildFlowQuery, manageWarnings, range, selectedViewId]);

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
    setURLLayer(layer);
  }, [layer]);
  React.useEffect(() => {
    setURLMetricFunction(metricFunction);
    if (metricFunction === 'rate') {
      setMetricType(undefined);
    } else if (!metricType) {
      setMetricType(defaultMetricType);
    }
    setURLMetricType(metricType);
  }, [metricFunction, metricType, setMetricType]);

  // update local storage saved query params
  React.useEffect(() => {
    if (!forcedFilters) {
      setQueryParams(getURLParams().toString());
    }
  }, [filters, range, limit, match, reporter, layer, metricFunction, metricType, setQueryParams, forcedFilters]);

  // update local storage enabled filters
  React.useEffect(() => {
    setDisabledFilters(getDisabledFiltersRecord(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  //clear warning message after 10s
  React.useEffect(() => {
    if (warningTimeOut.current) {
      clearTimeout(warningTimeOut.current);
    }

    warningTimeOut.current = setTimeout(() => setWarningMessage(undefined), 10000);
  }, [warningMessage]);

  // updates table filters and clears up the table for proper visualization of the
  // updating process
  const updateTableFilters = (f: Filter[]) => {
    setFilters(f);
    setFlows([]);
    setWarningMessage(undefined);
  };

  const clearFilters = () => {
    if (forcedFilters) {
      push(netflowTrafficPath);
    } else if (filters) {
      removeURLParam(URLParam.Filters);
      updateTableFilters([]);
    }
  };

  const viewTabs = () => {
    return (
      <Tabs
        id="netflow-traffic-tabs"
        usePageInsets
        activeKey={selectedViewId}
        onSelect={(event, eventkey) => selectView(eventkey as ViewId)}
        role="region"
      >
        {isAllowed(Feature.Overview) && (
          <Tab
            className="netflow-traffic-tab"
            eventKey={'overview'}
            title={<TabTitleText>{t('Overview')}</TabTitleText>}
          />
        )}
        <Tab
          className="netflow-traffic-tab"
          eventKey={'table'}
          title={<TabTitleText>{t('Flow Table')}</TabTitleText>}
        />
        <Tab
          className="netflow-traffic-tab"
          eventKey={'topology'}
          title={<TabTitleText>{t('Topology')}</TabTitleText>}
        />
      </Tabs>
    );
  };

  const actions = () => {
    return (
      <div className="co-actions">
        <TimeRangeDropdown
          data-test="time-range-dropdown"
          id="time-range-dropdown"
          range={range}
          setRange={setRange}
          openCustomModal={() => setTRModalOpen(true)}
        />
        <RefreshDropdown
          data-test="refresh-dropdown"
          id="refresh-dropdown"
          disabled={typeof range !== 'number'}
          interval={interval}
          setInterval={setInterval}
        />
        <Button
          data-test="refresh-button"
          id="refresh-button"
          className="co-action-refresh-button"
          variant="primary"
          onClick={() => tick()}
          icon={<SyncAltIcon style={{ animation: `spin ${loading ? 1 : 0}s linear infinite` }} />}
        />
      </div>
    );
  };

  const menuContent = () => {
    const items: JSX.Element[] = [];

    if (selectedViewId === 'overview') {
      items.push(
        <OverflowMenuItem isPersistent key="columns">
          <Button
            data-test="manage-overview-panels-button"
            id="manage-overview-panels-button"
            variant="link"
            className="overflow-button"
            icon={<ColumnsIcon />}
            onClick={() => setOverviewModalOpen(true)}
          >
            {t('Manage panels')}
          </Button>
        </OverflowMenuItem>
      );
    } else if (selectedViewId === 'table') {
      items.push(
        <OverflowMenuItem isPersistent key="columns">
          <Button
            data-test="manage-columns-button"
            id="manage-columns-button"
            variant="link"
            className="overflow-button"
            icon={<ColumnsIcon />}
            onClick={() => setColModalOpen(true)}
          >
            {t('Manage columns')}
          </Button>
        </OverflowMenuItem>
      );
      items.push(
        <OverflowMenuItem key="display">
          <DisplayDropdown data-test="display" id="display" setSize={setSize} />
        </OverflowMenuItem>
      );
      items.push(
        <OverflowMenuItem key="export">
          <Button
            data-test="export-button"
            id="export-button"
            variant="link"
            className="overflow-button"
            icon={<ExportIcon />}
            onClick={() => setExportModalOpen(true)}
          >
            {t('Export')}
          </Button>
        </OverflowMenuItem>
      );
    }

    items.push(
      <OverflowMenuItem key="fullscreen" isPersistent={selectedViewId === 'topology'}>
        <Button
          data-test="fullscreen-button"
          id="fullscreen-button"
          variant="link"
          className="overflow-button"
          icon={isFullScreen ? <CompressIcon /> : <ExpandIcon />}
          onClick={() => setFullScreen(!isFullScreen)}
        >
          {isFullScreen ? t('Collapse') : t('Expand')}
        </Button>
      </OverflowMenuItem>
    );
    return items;
  };

  const menuControl = () => {
    if (selectedViewId !== 'table') {
      return undefined;
    }
    return (
      <Dropdown
        data-test="more-options-dropdown"
        id="more-options-dropdown"
        onSelect={() => setOverflowMenuOpen(false)}
        toggle={
          <Button
            data-test="more-options-button"
            id="more-options-button"
            variant="link"
            className="overflow-button"
            icon={<EllipsisVIcon />}
            onClick={() => setOverflowMenuOpen(!isOverflowMenuOpen)}
          >
            {t('More options')}
          </Button>
        }
        isOpen={isOverflowMenuOpen}
        dropdownItems={[
          <DropdownGroup key="display-group" label={t('Display')}>
            <DropdownItem key="s" onClick={() => setSize('s')}>
              {t('Compact')}
            </DropdownItem>
            <DropdownItem key="m" onClick={() => setSize('m')}>
              {t('Normal')}
            </DropdownItem>
            <DropdownItem key="l" onClick={() => setSize('l')}>
              {t('Large')}
            </DropdownItem>
          </DropdownGroup>,
          <DropdownGroup key="export-group" label={t('Actions')}>
            <DropdownItem key="export" onClick={() => setExportModalOpen(true)}>
              {t('Export')}
            </DropdownItem>
          </DropdownGroup>,
          <DropdownGroup key="fullscreen-group" label={t('View')}>
            <DropdownItem key="fullscreen" onClick={() => setFullScreen(!isFullScreen)}>
              {isFullScreen ? t('Collapse') : t('Expand')}
            </DropdownItem>
          </DropdownGroup>
        ]}
      />
    );
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
          onClose={() => onRecordSelect(undefined)}
        />
      );
    } else if (isShowTopologyOptions) {
      return (
        <OptionsPanel
          id="optionsPanel"
          options={topologyOptions}
          setOptions={setTopologyOptions}
          metricScope={metricScope}
          onClose={() => setShowTopologyOptions(false)}
        />
      );
    } else if (isShowQuerySummary) {
      return (
        <SummaryPanel
          id="summaryPanel"
          flows={flows}
          stats={stats}
          lastRefresh={lastRefresh}
          range={range}
          onClose={() => setShowQuerySummary(false)}
        />
      );
    } else if (selectedElement) {
      return (
        <ElementPanel
          id="elementPanel"
          element={selectedElement}
          metrics={metrics}
          metricFunction={metricFunction}
          metricType={metricType}
          metricScope={metricScope}
          filters={filters}
          setFilters={setFilters}
          onClose={() => onElementSelect(undefined)}
        />
      );
    } else {
      return null;
    }
  };

  const pageContent = () => {
    switch (selectedViewId) {
      case 'overview':
        return (
          <NetflowOverview
            panels={panels}
            metricFunction={metricFunction}
            metricType={metricType}
            metricScope={metricScope}
            metrics={metrics}
            loading={loading}
            error={error}
            clearFilters={clearFilters}
          />
        );
      case 'table':
        return (
          <NetflowTable
            loading={loading}
            error={error}
            flows={flows}
            selectedRecord={selectedRecord}
            size={size}
            onSelect={onRecordSelect}
            clearFilters={clearFilters}
            columns={columns.filter(col => col.isSelected)}
          />
        );
      case 'topology':
        return (
          <NetflowTopology
            loading={loading}
            k8sModels={k8sModels}
            error={error}
            range={range}
            metricFunction={metricFunction}
            metricType={metricType}
            metricScope={metricScope}
            setMetricScope={setMetricScope}
            metrics={metrics}
            options={topologyOptions}
            setOptions={setTopologyOptions}
            filters={filters}
            setFilters={setFilters}
            toggleTopologyOptions={() => onToggleTopologyOptions(!isShowTopologyOptions)}
            selected={selectedElement}
            onSelect={onElementSelect}
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

  //update page on full screen change
  React.useEffect(() => {
    const header = document.getElementById('page-main-header');
    const sideBar = document.getElementById('page-sidebar');
    const notification = document.getElementsByClassName('co-global-notifications');
    [header, sideBar, ...notification].forEach(e => {
      if (isFullScreen) {
        e?.classList.add('hidden');
      } else {
        e?.classList.remove('hidden');
      }
    });
  }, [isFullScreen]);

  const slownessReason = React.useCallback(() => {
    if (match === 'any' && hasNonIndexFields(filters)) {
      return t(
        // eslint-disable-next-line max-len
        'When in "Match any" mode, try using only Namespace, Owner or Resource filters (which use indexed fields), or decrease limit / range, to improve the query performance'
      );
    }
    if (match === 'all' && !hasIndexFields(filters)) {
      return t(
        // eslint-disable-next-line max-len
        'Add Namespace, Owner or Resource filters (which use indexed fields), or decrease limit / range, to improve the query performance'
      );
    }
    return t('Add more filters or decrease limit / range to improve the query performance');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, filters]);

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection" className={isTab ? 'tab' : ''}>
      {
        //display title only if forced filters is not set
        _.isEmpty(forcedFilters) && (
          <div id="pageHeader">
            <div className="flex">
              <Text component={TextVariants.h1}>{t('Network Traffic')}</Text>
            </div>
          </div>
        )
      }
      <FiltersToolbar
        id="filter-toolbar"
        filters={filters}
        setFilters={updateTableFilters}
        clearFilters={clearFilters}
        queryOptionsProps={{
          limit,
          setLimit,
          match,
          setMatch,
          reporter,
          setReporter,
          allowReporterBoth: selectedViewId === 'table',
          useTopK: selectedViewId === 'overview',
          layer: layer,
          setLayer: setLayer
        }}
        forcedFilters={forcedFilters}
        actions={actions()}
        menuContent={menuContent()}
        menuControl={menuControl()}
      />
      {
        <Flex>
          <FlexItem flex={{ default: 'flex_1' }}>{viewTabs()}</FlexItem>
          <FlexItem>
            {selectedViewId !== 'table' && (
              <MetricFunctionDropdown
                data-test="metricFunction"
                id="metricFunction"
                selected={metricFunction}
                setMetricFunction={setMetricFunction}
              />
            )}
            {selectedViewId !== 'table' && metricFunction !== 'rate' && (
              <MetricTypeDropdown
                data-test="metricType"
                id="metricType"
                selected={metricType}
                setMetricType={setMetricType}
              />
            )}
            {selectedViewId !== 'table' && (
              <ScopeDropdown data-test="scope" id="scope" selected={metricScope} setScopeType={setMetricScope} />
            )}
          </FlexItem>
        </Flex>
      }
      <Drawer
        id="drawer"
        isInline
        isExpanded={
          selectedRecord !== undefined || selectedElement !== undefined || isShowTopologyOptions || isShowQuerySummary
        }
      >
        <DrawerContent id="drawerContent" panelContent={panelContent()}>
          <DrawerContentBody id="drawerBody">{pageContent()}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
      {selectedViewId === 'table' && (
        <QuerySummary
          flows={flows}
          range={range}
          stats={stats}
          lastRefresh={lastRefresh}
          toggleQuerySummary={() => onToggleQuerySummary(!isShowQuerySummary)}
        />
      )}
      <TimeRangeModal
        id="time-range-modal"
        isModalOpen={isTRModalOpen}
        setModalOpen={setTRModalOpen}
        range={typeof range === 'object' ? range : undefined}
        setRange={setRange}
      />
      <OverviewPanelsModal
        id="overview-panels-modal"
        isModalOpen={isOverviewModalOpen}
        setModalOpen={setOverviewModalOpen}
        panels={panels}
        setPanels={setSelectedPanels}
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
      {!_.isEmpty(warningMessage) && (
        <Alert
          id="netflow-warning"
          title={warningMessage}
          variant="warning"
          actionClose={<AlertActionCloseButton onClose={() => setWarningMessage(undefined)} />}
        >
          {slownessReason()}
        </Alert>
      )}
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
