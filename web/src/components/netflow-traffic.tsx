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
  ToggleGroupItem,
  Tooltip
} from '@patternfly/react-core';
import { ColumnsIcon, ExportIcon, SyncAltIcon, TableIcon, TopologyIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Record } from '../api/ipfix';
import { getFlows, getConfig } from '../api/routes';
import { Config, ConfigContext } from '../model/config';
import { QueryOptions } from '../model/query-options';
import { DefaultOptions, TopologyOptions } from '../model/topology';
import { Column, getDefaultColumns } from '../utils/columns';
import { TimeRange } from '../utils/datetime';
import { getHTTPErrorDetails } from '../utils/errors';
import { Feature, isAllowed } from '../utils/features-gate';
import { Filter } from '../utils/filters';
import {
  LOCAL_STORAGE_COLS_KEY,
  LOCAL_STORAGE_REFRESH_KEY,
  LOCAL_STORAGE_SIZE_KEY,
  LOCAL_STORAGE_CONFIG_KEY,
  useLocalStorage
} from '../utils/local-storage-hook';
import { usePoll } from '../utils/poll-hook';
import {
  buildQueryArguments,
  getFiltersFromURL,
  getQueryOptionsFromURL,
  getRangeFromURL,
  NETFLOW_TRAFFIC_PATH,
  QueryArguments,
  removeURLQueryArguments,
  setURLQueryArguments
} from '../utils/router';
import DisplayDropdown, { Size } from './dropdowns/display-dropdown';
import { RefreshDropdown } from './dropdowns/refresh-dropdown';
import TimeRangeDropdown from './dropdowns/time-range-dropdown';
import { FiltersToolbar } from './filters-toolbar';
import { ColumnsModal } from './modals/columns-modal';
import { ExportModal } from './modals/export-modal';
import TimeRangeModal from './modals/time-range-modal';
import { RecordPanel } from './netflow-record/record-panel';
import NetflowTable from './netflow-table/netflow-table';
import { LayoutName } from '../model/topology';
import NetflowTopology from './netflow-topology/netflow-topology';
import OptionsPanel from './netflow-topology/options-panel';
import './netflow-traffic.css';

export type ViewId = 'table' | 'topology';

export const NetflowTraffic: React.FC<{
  forcedFilters?: Filter[];
  initialQueryOptions?: QueryOptions;
}> = ({ forcedFilters, initialQueryOptions }) => {
  const { push } = useHistory();
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  const [loading, setLoading] = React.useState(true);
  const [flows, setFlows] = React.useState<Record[]>([]);
  const [layout, setLayout] = React.useState<LayoutName>(LayoutName.ColaNoForce);
  const [topologyOptions, setTopologyOptions] = React.useState<TopologyOptions>(DefaultOptions);
  const [isShowTopologyOptions, setShowTopologyOptions] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [size, setSize] = useLocalStorage<Size>(LOCAL_STORAGE_SIZE_KEY, 'm');
  const [config, setConfig] = useLocalStorage<Config>(LOCAL_STORAGE_CONFIG_KEY);
  const [isTRModalOpen, setTRModalOpen] = React.useState(false);
  const [isColModalOpen, setColModalOpen] = React.useState(false);
  const [isExportModalOpen, setExportModalOpen] = React.useState(false);
  const { t } = useTranslation('plugin__network-observability-plugin');

  //TODO: move default view to an Overview like dashboard instead of table
  const [selectedViewId, setSelectedViewId] = React.useState<ViewId>('table');

  //TODO: create a number range filter type for Packets & Bytes
  const [columns, setColumns] = useLocalStorage<Column[]>(LOCAL_STORAGE_COLS_KEY, getDefaultColumns(t, config), {
    id: 'id',
    criteria: 'isSelected'
  });
  const [filters, setFilters] = React.useState<Filter[]>(getFiltersFromURL(columns, config));
  const [range, setRange] = React.useState<number | TimeRange>(getRangeFromURL());
  const [queryOptions, setQueryOptions] = React.useState<QueryOptions>(
    initialQueryOptions ? initialQueryOptions : getQueryOptionsFromURL()
  );
  const [interval, setInterval] = useLocalStorage<number | undefined>(LOCAL_STORAGE_REFRESH_KEY);
  const isInit = React.useRef(true);
  const [selectedRecord, setSelectedRecord] = React.useState<Record | undefined>(undefined);

  const onSelect = (record?: Record) => {
    setTRModalOpen(false);
    setColModalOpen(false);
    setSelectedRecord(record);
  };

  const getQueryArguments = React.useCallback(() => {
    return buildQueryArguments(forcedFilters ? forcedFilters : filters, range, queryOptions);
  }, [filters, forcedFilters, queryOptions, range]);

  const tick = React.useCallback(
    (queryArgs?: QueryArguments) => {
      const qa = queryArgs ?? getQueryArguments();
      setLoading(true);
      setError(undefined);
      switch (selectedViewId) {
        case 'table':
          getFlows(qa)
            .then(setFlows)
            .catch(err => {
              setFlows([]);
              const errorMessage = getHTTPErrorDetails(err);
              setError(errorMessage);
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
    },
    [getQueryArguments, selectedViewId]
  );

  // Rewrite URL params on state change and tick
  React.useEffect(() => {
    // Skip on init if forcedFilters not set
    if (isInit.current) {
      isInit.current = false;
      if (!forcedFilters) {
        return;
      }
    }
    const qa = getQueryArguments();
    setURLQueryArguments(qa);
    tick(qa);
  }, [filters, forcedFilters, range, queryOptions, tick, getQueryArguments]);

  usePoll(tick, interval);

  React.useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(err => {
        const errorMessage = getHTTPErrorDetails(err);
        console.log(errorMessage);
      });
  }, [setConfig]);

  // updates table filters and clears up the table for proper visualization of the
  // updating process
  const updateTableFilters = (f: Filter[]) => {
    setFilters(f);
    setFlows([]);
  };

  const clearFilters = () => {
    if (_.isEmpty(forcedFilters)) {
      if (!_.isEmpty(filters)) {
        removeURLQueryArguments(filters!.map(f => f.colId));
      }
      updateTableFilters([]);
    } else {
      push(NETFLOW_TRAFFIC_PATH);
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
    switch (selectedViewId) {
      case 'table':
      case 'topology':
        return (
          <div className="co-actions">
            <TimeRangeDropdown
              id="time-range-dropdown"
              range={typeof range === 'number' ? range : undefined}
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
        );
      default:
        return null;
    }
  };

  const pageButtons = () => {
    switch (selectedViewId) {
      case 'table':
        return (
          <OverflowMenuGroup groupType="button" isPersistent>
            <OverflowMenuItem>
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
            </OverflowMenuItem>
            <DisplayDropdown id="display-dropdown" setSize={setSize} />
            <Tooltip content={t('Export')}>
              <Button
                id="export-button"
                variant="plain"
                onClick={() => setExportModalOpen(true)}
                aria-label={t('Export management')}
              >
                <ExportIcon color="#6A6E73" />
              </Button>
            </Tooltip>
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
          columns={getDefaultColumns(t, config, false, false)}
          filters={filters}
          range={range}
          options={queryOptions}
          setFilters={setFilters}
          setRange={setRange}
          setQueryOptions={setQueryOptions}
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
            layout={layout}
            options={topologyOptions}
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
      <ConfigContext.Provider value={config}>
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
          columns={columns}
          filters={filters}
          setFilters={updateTableFilters}
          clearFilters={clearFilters}
          queryOptions={queryOptions}
          setQueryOptions={setQueryOptions}
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
        <Drawer id="drawer" isExpanded={selectedRecord !== undefined || isShowTopologyOptions}>
          <DrawerContent id="drawerContent" panelContent={panelContent()}>
            <DrawerContentBody id="drawerBody">{pageContent()}</DrawerContentBody>
          </DrawerContent>
        </Drawer>
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
          queryArguments={getQueryArguments()}
          columns={columns.filter(c => c.fieldName)}
          queryOptions={queryOptions}
          range={range}
          filters={forcedFilters ? forcedFilters : filters}
        />
      </ConfigContext.Provider>
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
