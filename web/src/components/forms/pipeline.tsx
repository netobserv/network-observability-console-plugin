/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  K8sResourceCondition,
  K8sResourceConditionStatus,
  K8sResourceKind
} from '@openshift-console/dynamic-plugin-sdk';

import {
  DefaultTaskGroup,
  DEFAULT_EDGE_TYPE,
  DEFAULT_FINALLY_NODE_TYPE,
  DEFAULT_SPACER_NODE_TYPE,
  DEFAULT_TASK_NODE_TYPE,
  DEFAULT_WHEN_OFFSET,
  FinallyNode,
  getEdgesFromNodes,
  getSpacerNodes,
  Graph,
  GraphComponent,
  GRAPH_LAYOUT_END_EVENT,
  Layout,
  ModelKind,
  Node,
  PipelineDagreLayout,
  PipelineNodeModel,
  RunStatus,
  SpacerNode,
  TaskEdge,
  TaskNode,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  WhenDecorator
} from '@patternfly/react-topology';

import { getResizeObserver } from '@patternfly/react-core';
import { t } from 'i18next';
import _ from 'lodash';
import * as React from 'react';

export interface Step {
  id: string;
  type?: string;
  label: string;
  runAfterTasks?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}
export interface StepProps {
  element: Node;
}

export const StepNode: React.FunctionComponent<StepProps> = ({ element }) => {
  const data = element.getData();

  const whenDecorator = data?.whenStatus ? (
    <WhenDecorator element={element} status={data.whenStatus} leftOffset={DEFAULT_WHEN_OFFSET} />
  ) : null;

  return (
    <TaskNode element={element} selected={data?.selected} status={data?.status} onSelect={() => data?.onSelect?.()}>
      {whenDecorator}
    </TaskNode>
  );
};

const pipelineComponentFactory = (kind: ModelKind, type: string) => {
  if (kind === ModelKind.graph) {
    return GraphComponent;
  }
  switch (type) {
    case DEFAULT_TASK_NODE_TYPE:
      return StepNode;
    case DEFAULT_FINALLY_NODE_TYPE:
      return FinallyNode;
    case 'task-group':
      return DefaultTaskGroup;
    case 'finally-group':
      return DefaultTaskGroup;
    case DEFAULT_SPACER_NODE_TYPE:
      return SpacerNode;
    case 'finally-spacer-edge':
    case DEFAULT_EDGE_TYPE:
      return TaskEdge;
    default:
      return undefined;
  }
};

export type FlowCollectorPipelineProps = {
  existing: K8sResourceKind | null;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
};

export const Pipeline: React.FC<FlowCollectorPipelineProps> = ({ existing, selectedTypes, setSelectedTypes }) => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [controller, setController] = React.useState<Visualization>();

  const fit = React.useCallback(() => {
    if (controller && controller.hasGraph()) {
      controller.getGraph().fit();
    } else {
      console.error('onResize called before controller graph');
    }
  }, [controller]);

  const getStatus = React.useCallback(
    (types: string[], status: string) => {
      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const condition: K8sResourceCondition | null = existing?.status?.conditions?.find(
          (condition: K8sResourceCondition) => condition.type === type
        );
        if (condition?.status !== status) {
          if (condition?.status === 'Unknown') {
            return RunStatus.Skipped;
          } else if (condition?.type.startsWith('Waiting') || condition?.reason === 'Pending') {
            return RunStatus.Pending;
          }
          return RunStatus.Failed;
        }
      }
      return RunStatus.Succeeded;
    },
    [existing?.status?.conditions]
  );

  const getSteps = React.useCallback(() => {
    const steps: Step[] = [];

    if (existing?.spec?.agent?.type === 'eBPF') {
      const types = ['Ready'];
      steps.push({
        id: 'ebpf',
        label: 'eBPF agents',
        data: {
          status: getStatus(types, K8sResourceConditionStatus.True),
          selected: _.some(selectedTypes, t => types.includes(t)),
          onSelect: () => setSelectedTypes(types)
        }
      });
    }

    const flpStatuses = ['WaitingFLPParent', 'WaitingFLPMonolith'];
    if (existing?.spec?.deploymentModel === 'Kafka') {
      const types = ['WaitingFLPTransformer'];
      steps.push({
        id: 'kafka',
        label: 'Kafka',
        runAfterTasks: ['ebpf'],
        data: {
          status: getStatus(types, K8sResourceConditionStatus.False),
          selected: _.some(selectedTypes, t => types.includes(t)),
          onSelect: () => setSelectedTypes(types)
        }
      });
      flpStatuses.push(...types);
    }

    if (existing?.spec) {
      steps.push({
        id: 'flp',
        label: 'Flowlogs pipeline',
        runAfterTasks: [_.last(steps)!.id],
        data: {
          status: getStatus(flpStatuses, K8sResourceConditionStatus.False),
          selected: _.some(selectedTypes, t => flpStatuses.includes(t)),
          onSelect: () => setSelectedTypes(flpStatuses)
        }
      });
    }

    const cpRunAfter: string[] = [];
    if (existing?.spec?.loki?.enable) {
      const types = ['LokiIssue'];
      steps.push({
        id: 'loki',
        label: 'Loki',
        runAfterTasks: ['flp'],
        data: {
          status: getStatus(types, 'NoIssue'), // TODO: NoIssue / Unknown is not a valid status. That should be False.
          selected: _.some(selectedTypes, t => types.includes(t)),
          onSelect: () => setSelectedTypes(types)
        }
      });
      cpRunAfter.push('loki');
    }

    if (existing?.spec?.prometheus?.querier?.enable) {
      steps.push({
        id: 'prom',
        label: 'Prometheus',
        runAfterTasks: ['flp'],
        data: {
          onSelect: () => setSelectedTypes([])
        }
      });
      cpRunAfter.push('prom');
    }

    if (existing?.spec?.exporters?.length) {
      existing.spec.exporters.forEach((exporter: any, i: number) => {
        steps.push({
          id: `exporter-${i}`,
          label: exporter.type || t('Unknown'),
          runAfterTasks: ['flp'],
          data: {
            onSelect: () => setSelectedTypes([])
          }
        });
      });
    }

    if (existing?.spec?.consolePlugin?.enable && cpRunAfter.length) {
      steps.push({
        id: 'plugin',
        label: 'Console plugin',
        runAfterTasks: cpRunAfter,
        data: {
          onSelect: () => setSelectedTypes([])
        }
      });
    }

    return steps.map(s => ({
      type: s.type || 'DEFAULT_TASK_NODE',
      width: 180,
      height: 32,
      style: {
        padding: [45, 15]
      },
      ...s
    })) as PipelineNodeModel[];
  }, [existing, getStatus, selectedTypes, setSelectedTypes]);

  React.useEffect(() => {
    if (containerRef.current) {
      getResizeObserver(
        containerRef.current,
        () => {
          fit();
        },
        true
      );
    }
  }, [containerRef, controller, fit]);

  React.useEffect(() => {
    if (!controller) {
      return;
    }
    const steps = getSteps();
    const spacerNodes = getSpacerNodes(steps);
    const nodes = [...steps, ...spacerNodes];
    const edges = getEdgesFromNodes(steps);
    controller.fromModel(
      {
        nodes,
        edges,
        graph: {
          id: 'g1',
          type: 'graph',
          layout: 'pipelineLayout'
        }
      },
      false
    );
  }, [controller, getSteps]);

  //create controller on startup and register factories
  React.useEffect(() => {
    const c = new Visualization();
    c.registerComponentFactory(pipelineComponentFactory);
    c.registerLayoutFactory((type: string, graph: Graph): Layout | undefined => new PipelineDagreLayout(graph));
    c.addEventListener(GRAPH_LAYOUT_END_EVENT, fit);
    setController(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="pipeline-container-div" style={{ width: '100%', height: '100%' }} ref={containerRef}>
      <VisualizationProvider controller={controller}>
        <VisualizationSurface />
      </VisualizationProvider>
    </div>
  );
};

export default Pipeline;
