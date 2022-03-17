import { Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant, Spinner, Title } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';
import {
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  SelectionEventListener,
  SELECTION_EVENT,
  TopologyControlBar,
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface
} from '@patternfly/react-topology';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { generateDataModel, LayoutName, TopologyOptions } from '../../model/topology';
import { TimeRange } from '../../utils/datetime';
import { usePrevious } from '../../utils/previous-hook';
import { componentFactory } from './componentFactories/componentFactory';
import { stylesComponentFactory } from './componentFactories/stylesComponentFactory';
import { layoutFactory } from './layouts/layoutFactory';
import { TopologyMetrics } from '../../api/loki';

const controller = new Visualization();
controller.registerLayoutFactory(layoutFactory);
controller.registerComponentFactory(componentFactory);
controller.registerComponentFactory(stylesComponentFactory);

const NetflowTopology: React.FC<{
  loading?: boolean;
  error?: string;
  range: number | TimeRange;
  metrics: TopologyMetrics[];
  options: TopologyOptions;
  layout: LayoutName;
  lowScale: number;
  medScale: number;
  toggleTopologyOptions: () => void;
}> = ({ loading, error, range, metrics, layout, lowScale, medScale, options, toggleTopologyOptions }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [hasListeners, setHasListeners] = React.useState<boolean>(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>();
  const prevLayout = usePrevious(layout);
  const prevOptions = usePrevious(options);

  //get options with updated time range and max edge value
  const getNodeOptions = () => {
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
  };

  //reset graph and model
  const resetModel = () => {
    const model = {
      graph: {
        id: 'g1',
        type: 'graph',
        layout: layout
      }
    };
    controller.fromModel(model, false);
  };

  //update model merging existing nodes / edges
  const updateModel = () => {
    if (controller.hasGraph()) {
      const currentModel = controller.toModel();
      const mergedModel = generateDataModel(metrics, getNodeOptions(), t, currentModel.nodes, currentModel.edges);
      controller.fromModel(mergedModel);
    } else {
      console.error('updateModel called before controller graph');
    }
  };

  //update graph details level
  const setDetailsLevel = () => {
    if (controller.hasGraph()) {
      controller.getGraph().setDetailsLevelThresholds({
        low: lowScale,
        medium: medScale
      });
    }
  };

  //register event listeners
  if (!hasListeners) {
    setHasListeners(true);
    //TODO: implements selection
    controller.addEventListener<SelectionEventListener>(SELECTION_EVENT, ids => setSelectedIds(ids));
  }

  //update details on low / med scale change
  React.useEffect(() => {
    setDetailsLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowScale, medScale]);

  /*update model on layout / options / metrics change
   * reset graph and details level on specific layout / options change to force render
   */
  React.useEffect(() => {
    if (
      prevLayout !== layout ||
      (prevOptions &&
        (prevOptions.groupTypes !== options.groupTypes ||
          prevOptions.startCollapsed != options.startCollapsed ||
          prevOptions.edges != options.edges ||
          prevOptions.edgeTags != options.edgeTags ||
          prevOptions.nodeBadges != options.nodeBadges))
    ) {
      resetModel();
      setDetailsLevel();
    }
    updateModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, options, metrics, t]);

  if (error) {
    return (
      <EmptyState data-test="error-state" variant={EmptyStateVariant.small}>
        <Title headingLevel="h2" size="lg">
          {t('Unable to get topology')}
        </Title>
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  } else if (_.isEmpty(metrics) && loading) {
    return (
      <Bullseye data-test="loading-contents">
        <Spinner size="xl" />
      </Bullseye>
    );
  } else {
    return (
      <VisualizationProvider controller={controller}>
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
                  controller.getGraph().scaleBy(4 / 3);
                },
                zoomOutCallback: () => {
                  controller.getGraph().scaleBy(0.75);
                },
                fitToScreenCallback: () => {
                  controller.getGraph().fit(80);
                },
                resetViewCallback: () => {
                  controller.getGraph().reset();
                  controller.getGraph().layout();
                },
                //TODO: enable legend with display icons and colors
                legend: false
              })}
            />
          }
        >
          <VisualizationSurface state={{ selectedIds }} />
        </TopologyView>
      </VisualizationProvider>
    );
  }
};

export default NetflowTopology;
