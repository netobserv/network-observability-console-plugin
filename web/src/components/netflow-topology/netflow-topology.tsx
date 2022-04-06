import { Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant, Spinner, Title } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';
import {
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  Model,
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
import { TopologyMetrics } from '../../api/loki';
import { generateDataModel, LayoutName, TopologyOptions } from '../../model/topology';
import { TimeRange } from '../../utils/datetime';
import { Filter } from '../../utils/filters';
import { usePrevious } from '../../utils/previous-hook';
import componentFactory from './componentFactories/componentFactory';
import stylesComponentFactory from './componentFactories/stylesComponentFactory';
import layoutFactory from './layouts/layoutFactory';
const ZOOM_IN = 4 / 3;
const ZOOM_OUT = 3 / 4;
const FIT_PADDING = 80;

const TopologyContent: React.FC<{
  range: number | TimeRange;
  metrics: TopologyMetrics[];
  options: TopologyOptions;
  layout: LayoutName;
  filters: Filter[];
  toggleTopologyOptions: () => void;
}> = ({ range, metrics, layout, options, filters, toggleTopologyOptions }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const controller = useVisualizationController();

  const prevLayout = usePrevious(layout);
  const prevOptions = usePrevious(options);
  const prevFilters = usePrevious(filters);

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  //fit view to elements
  const fitView = React.useCallback(() => {
    if (controller && controller.hasGraph()) {
      controller.getGraph().fit(FIT_PADDING);
    } else {
      console.error('fitView called before controller graph');
    }
  }, [controller]);

  //get options with updated time range and max edge value
  const getNodeOptions = React.useCallback(() => {
    let rangeInSeconds: number;
    if (typeof range === 'number') {
      rangeInSeconds = range;
    } else {
      rangeInSeconds = (range.from - range.to) / 1000;
    }
    const maxEdgeValue = _.isEmpty(metrics)
      ? 0
      : metrics.reduce((prev, current) => (prev.total > current.total ? prev : current)).total;
    return { ...options, rangeInSeconds, maxEdgeValue } as TopologyOptions;
  }, [metrics, options, range]);

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
          layout: layout
        }
      };
      controller.fromModel(model, false);
      setDetailsLevel();
    }
  }, [controller, layout, setDetailsLevel]);

  //update details on low / med scale change
  React.useEffect(() => {
    setDetailsLevel();
  }, [controller, options.lowScale, options.medScale, setDetailsLevel]);

  //update model merging existing nodes / edges
  const updateModel = React.useCallback(() => {
    if (!controller) {
      return;
    } else if (!controller.hasGraph()) {
      resetGraph();
    }

    const currentModel = controller.toModel();
    const mergedModel = generateDataModel(metrics, getNodeOptions(), currentModel.nodes, currentModel.edges);
    controller.fromModel(mergedModel);
  }, [controller, getNodeOptions, metrics, resetGraph]);

  //update model on layout / options / metrics / filters change
  React.useEffect(() => {
    //update graph on layout / display change
    if (!controller.hasGraph() || prevLayout !== layout || prevOptions !== options) {
      resetGraph();
    }
    //then update model
    updateModel();
  }, [controller, metrics, filters, layout, options, prevLayout, prevOptions, resetGraph, updateModel]);

  //clear existing elements on query change before getting new metrics
  React.useEffect(() => {
    if (prevFilters !== filters) {
      //remove all elements except graph
      if (controller && controller.hasGraph()) {
        controller.getElements().forEach(e => {
          if (e.getType() !== 'graph') {
            controller.removeElement(e);
          }
        });
      }
    }
  }, [controller, filters, prevFilters]);

  useEventListener<SelectionEventListener>(SELECTION_EVENT, setSelectedIds);

  return (
    <TopologyView
      controlBar={
        <TopologyControlBar
          controlButtons={createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            customButtons: [
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
            fitToScreenCallback: fitView,
            resetViewCallback: () => {
              if (controller) {
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
      <VisualizationSurface state={{ selectedIds }} />
    </TopologyView>
  );
};

const NetflowTopology: React.FC<{
  loading?: boolean;
  error?: string;
  range: number | TimeRange;
  metrics: TopologyMetrics[];
  options: TopologyOptions;
  layout: LayoutName;
  filters: Filter[];
  toggleTopologyOptions: () => void;
}> = ({ loading, error, range, metrics, layout, options, filters, toggleTopologyOptions }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
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
    return (
      <EmptyState data-test="error-state" variant={EmptyStateVariant.small}>
        <Title headingLevel="h2" size="lg">
          {t('Unable to get topology')}
        </Title>
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  } else if (!controller || (_.isEmpty(metrics) && loading)) {
    return (
      <Bullseye data-test="loading-contents">
        <Spinner size="xl" />
      </Bullseye>
    );
  } else {
    return (
      <VisualizationProvider controller={controller}>
        <TopologyContent
          range={range}
          metrics={metrics}
          layout={layout}
          options={options}
          filters={filters}
          toggleTopologyOptions={toggleTopologyOptions}
        />
      </VisualizationProvider>
    );
  }
};

export default NetflowTopology;
