import {
  Button,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
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
import { ScopeConfigDef } from '../../model/scope';
import { TopologyOptions } from '../../model/topology';
import { exportToPng } from '../../utils/export';
import OverviewDisplayDropdown, { Size } from '../dropdowns/overview-display-dropdown';
import TableDisplayDropdown from '../dropdowns/table-display-dropdown';
import TopologyDisplayDropdown from '../dropdowns/topology-display-dropdown';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import { ViewId } from '../netflow-traffic';
import SearchComponent, { SearchEvent, SearchHandle } from '../search/search';
import './view-options-toolbar.css';

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
  overviewTruncateLength: TruncateLength;
  setOverviewTruncateLength: (v: TruncateLength) => void;
  topologyMetricFunction: StatFunction;
  setTopologyMetricFunction: (f: StatFunction) => void;
  topologyMetricType: MetricType;
  setTopologyMetricType: (t: MetricType) => void;
  topologyOptions: TopologyOptions;
  setTopologyOptions: (o: TopologyOptions) => void;
  allowedTypes: MetricType[];
  scopes: ScopeConfigDef[];
  size: Size;
  setSize: (v: Size) => void;
  setSearchEvent: (se: SearchEvent) => void;
  ref?: React.Ref<SearchHandle>;
}

// eslint-disable-next-line react/display-name
export const ViewOptionsToolbar: React.FC<ViewOptionsToolbarProps> = React.forwardRef(
  (props, ref: React.Ref<SearchHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');

    const onTopologyExport = React.useCallback(() => {
      const topology_flex = document.getElementsByClassName('pf-topology-visualization-surface__svg')[0];
      exportToPng('topology', topology_flex as HTMLElement, props.isDarkTheme);
    }, [props.isDarkTheme]);

    const onOverviewExport = React.useCallback(() => {
      const prevFocusState = props.overviewFocus;
      props.setOverviewFocus(false);
      setTimeout(() => {
        const overview_flex = document.getElementById('overview-flex');
        exportToPng('overview_page', overview_flex as HTMLElement, props.isDarkTheme, undefined, () =>
          props.setOverviewFocus(prevFocusState)
        );
      }, 500);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.isDarkTheme, props.setOverviewFocus]);

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
          <DropdownGroup key="panels-group" label={t('Manage')}>
            <DropdownItem
              key="panels"
              id="manage-overview-panels-button"
              onClick={() => props.setOverviewModalOpen(true)}
            >
              {t('Panels')}
            </DropdownItem>
          </DropdownGroup>
        );
        dropdownItems.push(
          <DropdownGroup key="export-group" label={t('Actions')}>
            <DropdownItem key="export" id="export-button" onClick={() => onOverviewExport()}>
              {t('Export overview')}
            </DropdownItem>
          </DropdownGroup>
        );
      } else if (props.selectedViewId === 'table') {
        dropdownItems.push(
          <DropdownGroup key="columns-group" label={t('Manage')}>
            <DropdownItem key="columns" id="manage-columns-button" onClick={() => props.setColModalOpen(true)}>
              {t('Columns')}
            </DropdownItem>
          </DropdownGroup>
        );
        dropdownItems.push(
          <DropdownGroup key="export-group" label={t('Actions')}>
            <DropdownItem key="export" id="export-button" onClick={() => props.setExportModalOpen(true)}>
              {t('Export')}
            </DropdownItem>
          </DropdownGroup>
        );
      } else if (props.selectedViewId === 'topology') {
        dropdownItems.push(
          <DropdownGroup key="export-group" label={t('Actions')}>
            <DropdownItem key="export" id="export-button" onClick={() => onTopologyExport()}>
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
          isOpen={props.isViewOptionOverflowMenuOpen}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              data-test="view-options-button"
              id="view-options-button"
              variant="plain"
              className="overflow-button"
              icon={<EllipsisVIcon />}
              isExpanded={props.isViewOptionOverflowMenuOpen}
              onClick={() => props.setViewOptionOverflowMenuOpen(!props.isViewOptionOverflowMenuOpen)}
              onBlur={() => props.setViewOptionOverflowMenuOpen(false)}
            >
              <>
                <EllipsisVIcon /> {t('More options')}
              </>
            </MenuToggle>
          )}
        >
          {dropdownItems}
        </Dropdown>
      );
    };

    return (
      <Toolbar
        data-test-id="view-options-toolbar"
        id="view-options-toolbar"
        className={props.isDarkTheme ? 'dark' : ''}
      >
        <ToolbarItem className="flex-start view-options-first">
          <OverflowMenuItem key="display">
            {props.selectedViewId === 'overview' && (
              <OverviewDisplayDropdown
                metricScope={props.metricScope}
                setMetricScope={props.setMetricScope}
                truncateLength={props.overviewTruncateLength}
                setTruncateLength={props.setOverviewTruncateLength}
                focus={props.overviewFocus}
                setFocus={props.setOverviewFocus}
                scopes={props.scopes}
              />
            )}
            {props.selectedViewId === 'table' && <TableDisplayDropdown size={props.size} setSize={props.setSize} />}
            {props.selectedViewId === 'topology' && (
              <TopologyDisplayDropdown
                metricFunction={props.topologyMetricFunction}
                setMetricFunction={props.setTopologyMetricFunction}
                metricType={props.topologyMetricType}
                setMetricType={props.setTopologyMetricType}
                metricScope={props.metricScope}
                setMetricScope={props.setMetricScope}
                topologyOptions={props.topologyOptions}
                setTopologyOptions={props.setTopologyOptions}
                allowedTypes={props.allowedTypes}
                scopes={props.scopes}
              />
            )}
          </OverflowMenuItem>
        </ToolbarItem>
        {props.selectedViewId === 'topology' && (
          <ToolbarItem className="flex-start" id="search-container" data-test="search-container">
            <SearchComponent ref={ref} setSearchEvent={props.setSearchEvent} isDark={props.isDarkTheme} />
          </ToolbarItem>
        )}
        <ToolbarItem className="flex-start view-options-last" align={{ default: 'alignEnd' }}>
          <OverflowMenu breakpoint="2xl">
            <OverflowMenuContent isPersistent>
              <OverflowMenuGroup groupType="button" isPersistent className="view-options-group flex-start">
                {viewOptionsContent()}
              </OverflowMenuGroup>
            </OverflowMenuContent>
            <OverflowMenuControl className="flex-start">{viewOptionsControl()}</OverflowMenuControl>
          </OverflowMenu>
        </ToolbarItem>
      </Toolbar>
    );
  }
);

export default ViewOptionsToolbar;
