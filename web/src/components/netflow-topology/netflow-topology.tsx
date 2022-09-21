import { Bullseye, Button, InputGroup, Spinner, TextInput, ValidatedOptions } from '@patternfly/react-core';
import { CogIcon, ExportIcon, SearchIcon, TimesIcon, AngleUpIcon, AngleDownIcon } from '@patternfly/react-icons';
import {
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  GraphElement,
  GRAPH_LAYOUT_END_EVENT,
  GRAPH_POSITION_CHANGE_EVENT,
  Model,
  Node,
  SelectionEventListener,
  SELECTION_EVENT,
  TopologyControlBar,
  TopologyView,
  useEventListener,
  useVisualizationController,
  Visualization,
  VisualizationProvider,
  VisualizationSurface
} from '@patternfly/react-topology';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { saveSvgAsPng } from 'save-svg-as-png';
import { Metrics } from '../../api/loki';
import { Filter } from '../../model/filters';
import { MetricFunction, MetricScope, MetricType } from '../../model/flow-query';
import {
  generateDataModel,
  LayoutName,
  TopologyGroupTypes,
  TopologyOptions,
  isElementFiltered,
  toggleElementFilter
} from '../../model/topology';
import { MetricScopeOptions } from '../../model/metrics';
import { TimeRange } from '../../utils/datetime';
import { usePrevious } from '../../utils/previous-hook';
import componentFactory from './componentFactories/componentFactory';
import stylesComponentFactory from './componentFactories/stylesComponentFactory';
import layoutFactory from './layouts/layoutFactory';
import './netflow-topology.css';
import { STEP_INTO_EVENT, FILTER_EVENT } from './styles/styleNode';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import LokiError from '../messages/loki-error';

export const HOVER_EVENT = 'hover';

let requestFit = false;
let waitForMetrics = false;
let lastNodeIdsFound: string[] = [];

const ZOOM_IN = 4 / 3;
const ZOOM_OUT = 3 / 4;
const FIT_PADDING = 80;

export const TopologyContent: React.FC<{
  k8sModels: { [key: string]: K8sModel };
  range: number | TimeRange;
  metricStep: number;
  metricFunction?: MetricFunction;
  metricType?: MetricType;
  metricScope: MetricScope;
  setMetricScope: (ms: MetricScope) => void;
  metrics: Metrics[];
  options: TopologyOptions;
  setOptions: (o: TopologyOptions) => void;
  filters: Filter[];
  setFilters: (v: Filter[]) => void;
  toggleTopologyOptions: () => void;
  selected: GraphElement | undefined;
  onSelect: (e: GraphElement | undefined) => void;
}> = ({
  k8sModels,
  range,
  metricStep,
  metricFunction,
  metricType,
  metricScope,
  setMetricScope,
  metrics,
  options,
  setOptions,
  filters,
  setFilters,
  toggleTopologyOptions,
  selected,
  onSelect
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const controller = useVisualizationController();

  const prevMetrics = usePrevious(metrics);
  const prevMetricStep = usePrevious(metricStep);
  const prevMetricFunction = usePrevious(metricFunction);
  const prevMetricType = usePrevious(metricType);
  const prevMetricScope = usePrevious(metricScope);
  const prevOptions = usePrevious(options);

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [hoveredId, setHoveredId] = React.useState<string>('');
  const [searchValue, setSearchValue] = React.useState<string>('');
  const [searchValidated, setSearchValidated] = React.useState<ValidatedOptions>();
  const [searchResultCount, setSearchResultCount] = React.useState<string>('');

  //search element by label or secondaryLabel
  const onSearch = (searchValue: string, next = true) => {
    if (_.isEmpty(searchValue)) {
      return;
    }

    if (controller && controller.hasGraph()) {
      const currentModel = controller.toModel();
      const matchingNodeModels =
        currentModel.nodes?.filter(
          n => n.label?.includes(searchValue) || n.data?.secondaryLabel?.includes(searchValue)
        ) || [];

      if (next) {
        //go back to first match if last item is reached
        if (lastNodeIdsFound.length === matchingNodeModels.length) {
          lastNodeIdsFound = [];
        }
      } else {
        if (lastNodeIdsFound.length === 1) {
          //fill matching ids except last
          lastNodeIdsFound = matchingNodeModels.map(n => n.id);
          lastNodeIdsFound.splice(-1);
        } else {
          //remove previous match
          lastNodeIdsFound.splice(-2);
        }
      }

      const nodeModelsFound = matchingNodeModels.filter(n => !lastNodeIdsFound.includes(n.id));
      const nodeFound = !_.isEmpty(nodeModelsFound) ? controller.getNodeById(nodeModelsFound![0].id) : undefined;
      if (nodeFound) {
        const id = nodeFound.getId();
        onSelectIds([id]);
        lastNodeIdsFound.push(id);
        setSearchResultCount(`${lastNodeIdsFound.length}/${lastNodeIdsFound.length + nodeModelsFound!.length - 1}`);
        const bounds = controller.getGraph().getBounds();
        controller.getGraph().panIntoView(nodeFound, {
          offset: Math.min(bounds.width, bounds.height) / 2,
          minimumVisible: 100
        });
        setSearchValidated(ValidatedOptions.success);
      } else {
        lastNodeIdsFound = [];
        setSearchResultCount('');
        onSelectIds([]);
        setSearchValidated(ValidatedOptions.error);
      }
    } else {
      console.error('searchElement called before controller graph');
    }
  };

  //update search value and clear indicators
  const onChangeSearch = (v = '') => {
    lastNodeIdsFound = [];
    setSearchResultCount('');
    setSearchValidated(ValidatedOptions.default);
    setSearchValue(v);
  };

  const onFilter = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      const isFiltered = isElementFiltered(data, filters, t);
      toggleElementFilter(data, isFiltered, filters, setFilters, t);
      setSelectedIds([data.id]);
    },
    [filters, setFilters, t]
  );

  const onStepInto = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      let scope: MetricScopeOptions;
      let groupTypes: TopologyGroupTypes;
      switch (metricScope) {
        case MetricScopeOptions.HOST:
          scope = MetricScopeOptions.NAMESPACE;
          groupTypes = TopologyGroupTypes.NONE;
          break;
        case MetricScopeOptions.NAMESPACE:
          scope = MetricScopeOptions.OWNER;
          groupTypes = TopologyGroupTypes.NAMESPACES;
          break;
        default:
          scope = MetricScopeOptions.RESOURCE;
          groupTypes = TopologyGroupTypes.OWNERS;
      }
      setMetricScope(scope);
      setOptions({
        ...options,
        groupTypes
      });
      onFilter({
        ...data,
        isFiltered: true,
        isClearFilters: true
      });
      //clear search
      onChangeSearch();
      //clear selection
      onSelect(undefined);
    },
    [metricScope, onFilter, onSelect, options, setMetricScope, setOptions]
  );

  const onHover = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      setHoveredId(data.isHovered ? data.id : '');
    },
    []
  );

  const onSelectIds = React.useCallback(
    (ids: string[]) => {
      setSelectedIds(ids);
      onSelect(ids.length ? controller.getElementById(ids[0]) : undefined);
    },
    [controller, onSelect]
  );

  //fit view to elements
  const fitView = React.useCallback(() => {
    if (controller && controller.hasGraph()) {
      controller.getGraph().fit(FIT_PADDING);
    } else {
      console.error('fitView called before controller graph');
    }
  }, [controller]);

  const onLayoutEnd = React.useCallback(() => {
    //fit view to new loaded elements
    if (requestFit) {
      requestFit = false;
      if ([LayoutName.Concentric, LayoutName.Dagre, LayoutName.Grid].includes(options.layout)) {
        fitView();
      } else {
        //TODO: find a smoother way to fit while elements are still moving
        setTimeout(fitView, 100);
        setTimeout(fitView, 250);
        setTimeout(fitView, 500);
      }
    }
  }, [fitView, options.layout]);

  const onLayoutPositionChange = React.useCallback(() => {
    if (controller && controller.hasGraph()) {
      //hide popovers on pan / zoom
      const popover = document.querySelector('[aria-labelledby="popover-decorator-header"]');
      if (popover) {
        (popover as HTMLElement).style.display = 'none';
      }
    }
  }, [controller]);

  //get options with updated time range and max edge value
  const getOptions = React.useCallback(() => {
    let rangeInSeconds: number;
    if (typeof range === 'number') {
      rangeInSeconds = range;
    } else {
      rangeInSeconds = (range.from - range.to) / 1000;
    }
    const maxEdgeValue = _.isEmpty(metrics)
      ? 0
      : metrics.reduce((prev, current) => (prev.total > current.total ? prev : current)).total;
    return {
      ...options,
      rangeInSeconds,
      maxEdgeValue,
      metricFunction,
      metricType
    } as TopologyOptions;
  }, [range, metrics, options, metricFunction, metricType]);

  //update graph details level
  const setDetailsLevel = React.useCallback(() => {
    if (controller && controller.hasGraph()) {
      controller.getGraph().setDetailsLevelThresholds({
        low: options.lowScale,
        medium: options.medScale
      });
    }
  }, [controller, options.lowScale, options.medScale]);

  //reset graph and model
  const resetGraph = React.useCallback(() => {
    if (controller) {
      const model: Model = {
        graph: {
          id: 'g1',
          type: 'graph',
          layout: options.layout
        }
      };
      controller.fromModel(model, false);
      setDetailsLevel();
    }
  }, [controller, options.layout, setDetailsLevel]);

  //update details on low / med scale change
  React.useEffect(() => {
    setDetailsLevel();
  }, [controller, options.lowScale, options.medScale, setDetailsLevel]);

  //update model merging existing nodes / edges
  const updateModel = React.useCallback(() => {
    if (!controller) {
      return;
    } else if (!controller.hasGraph()) {
      console.error('updateModel called while controller has no graph');
    } else if (waitForMetrics && prevMetrics === metrics) {
      return;
    }
    waitForMetrics = false;

    //highlight either hoveredId or selected id
    let highlightedId = hoveredId;
    if (!highlightedId && selectedIds.length === 1) {
      highlightedId = selectedIds[0];
    }

    const updatedModel = generateDataModel(
      metrics,
      getOptions(),
      metricStep,
      metricScope,
      searchValue,
      highlightedId,
      filters,
      t,
      k8sModels
    );
    const allIds = [...(updatedModel.nodes || []), ...(updatedModel.edges || [])].map(item => item.id);
    controller.getElements().forEach(e => {
      if (e.getType() !== 'graph') {
        if (allIds.includes(e.getId())) {
          //keep previous data
          switch (e.getType()) {
            case 'node':
              const updatedNode = updatedModel.nodes?.find(n => n.id === e.getId());
              if (updatedNode) {
                updatedNode.data = { ...e.getData(), ...updatedNode.data };
              }
              break;
            case 'group':
              const updatedGroup = updatedModel.nodes?.find(n => n.id === e.getId());
              if (updatedGroup) {
                updatedGroup.collapsed = (e as Node).isCollapsed();
              }
              break;
          }
        } else {
          controller.removeElement(e);
        }
      }
    });
    controller.fromModel(updatedModel);
  }, [
    controller,
    prevMetrics,
    metrics,
    hoveredId,
    selectedIds,
    getOptions,
    metricStep,
    metricScope,
    searchValue,
    filters,
    t,
    k8sModels
  ]);

  //update model on layout / metrics / filters change
  React.useEffect(() => {
    //update graph
    if (
      !controller.hasGraph() ||
      prevOptions?.layout !== options.layout ||
      prevOptions.startCollapsed !== options.startCollapsed
    ) {
      resetGraph();
    }

    //skip refresh if scope / group changed. It will refresh after getting new metrics
    if (
      prevOptions &&
      (prevMetricStep !== metricStep ||
        prevMetricScope !== metricScope ||
        prevOptions.groupTypes !== options.groupTypes)
    ) {
      waitForMetrics = true;
      return;
    }

    //then update model
    updateModel();
  }, [
    controller,
    metrics,
    filters,
    options,
    prevOptions,
    resetGraph,
    updateModel,
    prevMetricStep,
    metricStep,
    prevMetricScope,
    metricScope
  ]);

  //request fit on layout end when filter / options change
  React.useEffect(() => {
    requestFit = true;
  }, [filters, options]);

  //clear existing edge tags on query change before getting new metrics
  React.useEffect(() => {
    if (controller && controller.hasGraph()) {
      if (prevMetricFunction !== metricFunction || prevMetricType !== metricType) {
        //remove edge tags on metrics change
        controller.getElements().forEach(e => {
          if (e.getType() === 'edge') {
            e.setData({ ...e.getData(), tag: undefined });
          }
        });
      }
    }
  }, [controller, metricFunction, metricType, prevMetricFunction, prevMetricType]);

  //refresh UI selected items
  React.useEffect(() => {
    const elementId = selected?.getId();
    const selectedId = _.isEmpty(selectedIds) ? undefined : selectedIds[0];
    if (elementId !== selectedId) {
      setSelectedIds(elementId ? [elementId] : []);
    }
  }, [selected, selectedIds]);

  useEventListener<SelectionEventListener>(SELECTION_EVENT, onSelectIds);
  useEventListener(FILTER_EVENT, onFilter);
  useEventListener(STEP_INTO_EVENT, onStepInto);
  useEventListener(HOVER_EVENT, onHover);
  useEventListener(GRAPH_LAYOUT_END_EVENT, onLayoutEnd);
  useEventListener(GRAPH_POSITION_CHANGE_EVENT, onLayoutPositionChange);

  return (
    <TopologyView
      data-test="topology-view"
      controlBar={
        <TopologyControlBar
          data-test="topology-control-bar"
          controlButtons={createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            fitToScreen: false,
            customButtons: [
              {
                id: 'export',
                icon: <ExportIcon />,
                tooltip: t('Export'),
                callback: () => {
                  const svg = document.getElementsByClassName('pf-topology-visualization-surface__svg')[0];
                  saveSvgAsPng(svg, 'topology.png', {
                    backgroundColor: '#fff',
                    encoderOptions: 0
                  });
                }
              },
              {
                id: 'options',
                icon: <CogIcon />,
                tooltip: t('More options'),
                callback: () => {
                  toggleTopologyOptions();
                }
              }
            ],
            zoomInCallback: () => {
              controller && controller.getGraph().scaleBy(ZOOM_IN);
            },
            zoomOutCallback: () => {
              controller && controller.getGraph().scaleBy(ZOOM_OUT);
            },
            resetViewCallback: () => {
              if (controller) {
                requestFit = true;
                controller.getGraph().reset();
                controller.getGraph().layout();
              }
            },
            //TODO: enable legend with display icons and colors
            legend: false
          })}
        />
      }
    >
      <VisualizationSurface data-test="visualization-surface" state={{ selectedIds }} />
      <div id="topology-search-container" data-test="topology-search-container">
        <InputGroup>
          <TextInput
            data-test="search-topology-element-input"
            id="search-topology-element-input"
            className={'search'}
            placeholder={t('Find in view')}
            autoFocus
            type={searchValidated !== ValidatedOptions.default ? 'text' : 'search'}
            aria-label="search"
            onKeyPress={e => e.key === 'Enter' && onSearch(searchValue)}
            onChange={onChangeSearch}
            value={searchValue}
            validated={searchValidated}
          />
          {!_.isEmpty(searchResultCount) ? (
            <TextInput
              value={searchResultCount}
              isDisabled
              id="topology-search-result-count"
              data-test="topology-search-result-count"
            />
          ) : (
            <></>
          )}
          {_.isEmpty(searchResultCount) ? (
            <Button
              data-test="search-topology-element-button"
              id="search-topology-element-button"
              variant="plain"
              aria-label="search for element button"
              onClick={() => (searchValidated === ValidatedOptions.error ? onChangeSearch() : onSearch(searchValue))}
            >
              {searchValidated === ValidatedOptions.error ? <TimesIcon /> : <SearchIcon />}
            </Button>
          ) : (
            <>
              <Button
                data-test="prev-search-topology-element-button"
                id="prev-search-topology-element-button"
                variant="plain"
                aria-label="previous button for search element"
                onClick={() => onSearch(searchValue, false)}
              >
                <AngleUpIcon />
              </Button>
              <Button
                data-test="next-search-topology-element-button"
                id="next-search-topology-element-button"
                variant="plain"
                aria-label="next button for search element"
                onClick={() => onSearch(searchValue)}
              >
                <AngleDownIcon />
              </Button>
              <Button
                data-test="clear-search-topology-element-button"
                id="clear-search-topology-element-button"
                variant="plain"
                aria-label="clear button for search element"
                onClick={() => onChangeSearch()}
              >
                <TimesIcon />
              </Button>
            </>
          )}
        </InputGroup>
      </div>
    </TopologyView>
  );
};

export const NetflowTopology: React.FC<{
  loading?: boolean;
  k8sModels: { [key: string]: K8sModel };
  error?: string;
  range: number | TimeRange;
  metricStep: number;
  metricFunction?: MetricFunction;
  metricType?: MetricType;
  metricScope: MetricScope;
  setMetricScope: (ms: MetricScope) => void;
  metrics: Metrics[];
  options: TopologyOptions;
  setOptions: (o: TopologyOptions) => void;
  filters: Filter[];
  setFilters: (v: Filter[]) => void;
  toggleTopologyOptions: () => void;
  selected: GraphElement | undefined;
  onSelect: (e: GraphElement | undefined) => void;
}> = ({
  loading,
  k8sModels,
  error,
  range,
  metricStep,
  metricFunction,
  metricType,
  metricScope,
  setMetricScope,
  metrics,
  options,
  setOptions,
  filters,
  setFilters,
  toggleTopologyOptions,
  selected,
  onSelect
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [controller, setController] = React.useState<Visualization>();

  //create controller on startup and register factories
  React.useEffect(() => {
    const c = new Visualization();
    c.registerLayoutFactory(layoutFactory);
    c.registerComponentFactory(componentFactory);
    c.registerComponentFactory(stylesComponentFactory);
    setController(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <LokiError title={t('Unable to get topology')} error={error} />;
  } else if (!controller || (_.isEmpty(metrics) && loading)) {
    return (
      <Bullseye data-test="loading-contents">
        <Spinner size="xl" />
      </Bullseye>
    );
  } else {
    return (
      <VisualizationProvider data-test="visualization-provider" controller={controller}>
        <TopologyContent
          k8sModels={k8sModels}
          range={range}
          metricStep={metricStep}
          metricFunction={metricFunction}
          metricType={metricType}
          metricScope={metricScope}
          setMetricScope={setMetricScope}
          metrics={metrics}
          options={options}
          setOptions={setOptions}
          filters={filters}
          setFilters={setFilters}
          toggleTopologyOptions={toggleTopologyOptions}
          selected={selected}
          onSelect={onSelect}
        />
      </VisualizationProvider>
    );
  }
};

export default NetflowTopology;
