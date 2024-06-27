import {
  Button,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuControl,
  OverflowMenuGroup,
  OverflowMenuItem,
  Toolbar,
  ToolbarItem
} from '@patternfly/react-core';
import { ColumnsIcon, EllipsisVIcon, ExportIcon } from '@patternfly/react-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope, MetricType, StatFunction } from 'src/model/flow-query';
import { TopologyOptions } from '../../model/topology';
import { exportToPng } from '../../utils/export';
import OverviewDisplayDropdown, { Size } from '../dropdowns/overview-display-dropdown';
import TableDisplayDropdown from '../dropdowns/table-display-dropdown';
import TopologyDisplayDropdown from '../dropdowns/topology-display-dropdown';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import { ViewId } from '../netflow-traffic';
import SearchComponent, { SearchEvent, SearchHandle } from '../search/search';

export interface ViewOptionsToolbarProps {
  isDarkTheme: boolean;
  overviewFocus: boolean;
  setOverviewFocus: (v: boolean) => void;
  selectedViewId: ViewId;
  setOverviewModalOpen: (v: boolean) => void;
  setColModalOpen: (v: boolean) => void;
  setExportModalOpen: (v: boolean) => void;
  isViewOptionOverflowMenuOpen: boolean;
  setViewOptionOverflowMenuOpen: (v: boolean) => void;
  metricScope: FlowScope;
  setMetricScope: (s: FlowScope) => void;
  truncateLength: TruncateLength;
  setTruncateLength: (v: TruncateLength) => void;
  metricFunction: StatFunction;
  setMetricFunction: (f: StatFunction) => void;
  metricType: MetricType;
  setMetricType: (t: MetricType) => void;
  topologyOptions: TopologyOptions;
  setTopologyOptions: (o: TopologyOptions) => void;
  allowPktDrop: boolean;
  allowDNSMetric: boolean;
  allowRTTMetric: boolean;
  allowedScopes: FlowScope[];
  size: Size;
  setSize: (v: Size) => void;
  setSearchEvent: (se: SearchEvent) => void;
  ref?: React.Ref<SearchHandle>;
  children?: React.ReactNode;
}

export const ViewOptionsToolbar: React.FC<ViewOptionsToolbarProps> = props => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const onTopologyExport = () =>
    React.useCallback(() => {
      const topology_flex = document.getElementsByClassName('pf-topology-visualization-surface__svg')[0];
      exportToPng('topology', topology_flex as HTMLElement, props.isDarkTheme);
    }, [props.isDarkTheme]);

  const onOverviewExport = () => {
    const prevFocusState = props.overviewFocus;
    props.setOverviewFocus(false);
    setTimeout(() => {
      const overview_flex = document.getElementById('overview-flex');
      exportToPng('overview_page', overview_flex as HTMLElement, props.isDarkTheme, undefined, () =>
        props.setOverviewFocus(prevFocusState)
      );
    }, 500);
  };

  const viewOptionsContent = () => {
    const items: JSX.Element[] = [];

    if (props.selectedViewId === 'overview') {
      items.push(
        <OverflowMenuItem key="panels">
          <Button
            data-test="manage-overview-panels-button"
            id="manage-overview-panels-button"
            variant="link"
            className="overflow-button"
            icon={<ColumnsIcon />}
            onClick={() => props.setOverviewModalOpen(true)}
          >
            {t('Manage panels')}
          </Button>
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
            onClick={() => onOverviewExport()}
          >
            {t('Export overview')}
          </Button>
        </OverflowMenuItem>
      );
    } else if (props.selectedViewId === 'table') {
      items.push(
        <OverflowMenuItem key="columns">
          <Button
            data-test="manage-columns-button"
            id="manage-columns-button"
            variant="link"
            className="overflow-button"
            icon={<ColumnsIcon />}
            onClick={() => props.setColModalOpen(true)}
          >
            {t('Manage columns')}
          </Button>
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
            onClick={() => props.setExportModalOpen(true)}
          >
            {t('Export data')}
          </Button>
        </OverflowMenuItem>
      );
    } else if (props.selectedViewId === 'topology') {
      items.push(
        <OverflowMenuItem key="export">
          <Button
            data-test="export-button"
            id="export-button"
            variant="link"
            className="overflow-button"
            icon={<ExportIcon />}
            onClick={() => onTopologyExport()}
          >
            {t('Export topology view')}
          </Button>
        </OverflowMenuItem>
      );
    }
    return items;
  };

  const viewOptionsControl = () => {
    const dropdownItems: JSX.Element[] = [];

    if (props.selectedViewId === 'overview') {
      dropdownItems.push(
        <DropdownGroup key="panels" label={t('Manage')}>
          <DropdownItem key="export" onClick={() => props.setOverviewModalOpen(true)}>
            {t('Panels')}
          </DropdownItem>
        </DropdownGroup>
      );
      dropdownItems.push(
        <DropdownGroup key="export-group" label={t('Actions')}>
          <DropdownItem key="export" onClick={() => onOverviewExport()}>
            {t('Export overview')}
          </DropdownItem>
        </DropdownGroup>
      );
    } else if (props.selectedViewId === 'table') {
      dropdownItems.push(
        <DropdownGroup key="columns" label={t('Manage')}>
          <DropdownItem key="export" onClick={() => props.setColModalOpen(true)}>
            {t('Columns')}
          </DropdownItem>
        </DropdownGroup>
      );
      dropdownItems.push(
        <DropdownGroup key="export-group" label={t('Actions')}>
          <DropdownItem key="export" onClick={() => props.setExportModalOpen(true)}>
            {t('Export')}
          </DropdownItem>
        </DropdownGroup>
      );
    } else if (props.selectedViewId === 'topology') {
      dropdownItems.push(
        <DropdownGroup key="export-group" label={t('Actions')}>
          <DropdownItem key="export" onClick={() => onTopologyExport()}>
            {t('Export view')}
          </DropdownItem>
        </DropdownGroup>
      );
    }

    return (
      <Dropdown
        data-test="view-options-dropdown"
        id="view-options-dropdown"
        onSelect={() => props.setViewOptionOverflowMenuOpen(false)}
        toggle={
          <Button
            data-test="view-options-button"
            id="view-options-button"
            variant="link"
            className="overflow-button"
            icon={<EllipsisVIcon />}
            onClick={() => props.setViewOptionOverflowMenuOpen(!props.isViewOptionOverflowMenuOpen)}
          >
            {t('More options')}
          </Button>
        }
        isOpen={props.isViewOptionOverflowMenuOpen}
        dropdownItems={dropdownItems}
      />
    );
  };

  return (
    <Toolbar data-test-id="view-options-toolbar" id="view-options-toolbar" className={props.isDarkTheme ? 'dark' : ''}>
      <ToolbarItem className="flex-start view-options-first">
        <OverflowMenuItem key="display">
          {props.selectedViewId === 'overview' && (
            <OverviewDisplayDropdown
              metricScope={props.metricScope}
              setMetricScope={props.setMetricScope}
              truncateLength={props.truncateLength}
              setTruncateLength={props.setTruncateLength}
              focus={props.overviewFocus}
              setFocus={props.setOverviewFocus}
              allowedScopes={props.allowedScopes}
            />
          )}
          {props.selectedViewId === 'table' && <TableDisplayDropdown size={props.size} setSize={props.setSize} />}
          {props.selectedViewId === 'topology' && (
            <TopologyDisplayDropdown
              metricFunction={props.metricFunction}
              setMetricFunction={props.setMetricFunction}
              metricType={props.metricType}
              setMetricType={props.setMetricType}
              metricScope={props.metricScope}
              setMetricScope={props.setMetricScope}
              topologyOptions={props.topologyOptions}
              setTopologyOptions={props.setTopologyOptions}
              allowPktDrop={props.allowPktDrop}
              allowDNSMetric={props.allowDNSMetric}
              allowRTTMetric={props.allowRTTMetric}
              allowedScopes={props.allowedScopes}
            />
          )}
        </OverflowMenuItem>
      </ToolbarItem>
      {props.selectedViewId === 'topology' && (
        <ToolbarItem className="flex-start" id="search-container" data-test="search-container">
          <SearchComponent ref={props.ref} setSearchEvent={props.setSearchEvent} isDark={props.isDarkTheme} />
        </ToolbarItem>
      )}
      <ToolbarItem className="flex-start view-options-last" alignment={{ default: 'alignRight' }}>
        <OverflowMenu breakpoint="2xl">
          <OverflowMenuContent isPersistent>
            <OverflowMenuGroup groupType="button" isPersistent className="flex-start">
              {viewOptionsContent()}
            </OverflowMenuGroup>
          </OverflowMenuContent>
          <OverflowMenuControl className="flex-start">{viewOptionsControl()}</OverflowMenuControl>
        </OverflowMenu>
      </ToolbarItem>
    </Toolbar>
  );
};

export default ViewOptionsToolbar;
