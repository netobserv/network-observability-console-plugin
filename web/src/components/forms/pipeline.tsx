/* eslint-disable @typescript-eslint/no-explicit-any */
import { K8sResourceCondition, K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

import {
  DefaultTaskGroup as taskGroup,
  DEFAULT_EDGE_TYPE as edgeType,
  DEFAULT_FINALLY_NODE_TYPE as finallyNodeType,
  DEFAULT_SPACER_NODE_TYPE as spacerNodeType,
  DEFAULT_TASK_NODE_TYPE as taskNodeType,
  DEFAULT_WHEN_OFFSET as whenOffset,
  FinallyNode,
  getEdgesFromNodes,
  getSpacerNodes,
  Graph,
  GraphComponent,
  GRAPH_LAYOUT_END_EVENT as layoutEndEvent,
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
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

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
    <WhenDecorator element={element} status={data.whenStatus} leftOffset={whenOffset} />
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
    case taskNodeType:
      return StepNode;
    case finallyNodeType:
      return FinallyNode;
    case 'task-group':
      return taskGroup;
    case 'finally-group':
      return taskGroup;
    case spacerNodeType:
      return SpacerNode;
    case 'finally-spacer-edge':
    case edgeType:
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
  const { t } = useTranslation('plugin__netobserv-plugin');

  const containerRef = React.createRef<HTMLDivElement>();
  const [controller, setController] = React.useState<Visualization>();
  const [isLayouting, setIsLayouting] = React.useState(false);

  const fit = React.useCallback(() => {
    if (controller && controller.hasGraph()) {
      controller.getGraph().fit();
      // Only reveal after fit completes
      requestAnimationFrame(() => {
        setIsLayouting(false);
      });
    }
  }, [controller]);

  const getStatus = React.useCallback(
    (types: string[], status: string) => {
      let hasWarning = false;
      let hasFailure = false;

      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const condition: K8sResourceCondition | null = existing?.status?.conditions?.find(
          (condition: K8sResourceCondition) => condition.type === type
        );
        if (condition?.status !== status && condition?.reason !== 'Unused') {
          if (condition?.status === 'Unknown') {
            return RunStatus.Skipped;
          } else if (condition?.type.startsWith('Waiting') || condition?.reason === 'Pending') {
            return RunStatus.Pending;
          }
          // Check if this is a warning type
          if (type.toLowerCase().includes('warning')) {
            hasWarning = true;
          } else {
            hasFailure = true;
          }
        }
      }
      // Failures take priority over warnings
      if (hasFailure) {
        return RunStatus.Failed;
      }
      if (hasWarning) {
        // PatternFly topology doesn't have a dedicated Warning status,
        // but we can use the same color scheme by using RunStatus.Cancelled
        // which typically shows yellow/orange
        return RunStatus.Cancelled;
      }
      return RunStatus.Succeeded;
    },
    [existing?.status?.conditions]
  );

  const getSteps = React.useCallback(() => {
    const steps: Step[] = [];

    const overallTypes = ['Ready'];
    const overallStatus = getStatus(overallTypes, 'True');
    if (existing?.spec?.agent?.type === 'eBPF') {
      steps.push({
        id: 'ebpf',
        label: 'eBPF agents',
        data: {
          status: overallStatus,
          selected: _.some(selectedTypes, t => overallTypes.includes(t)),
          onSelect: () => setSelectedTypes(overallTypes)
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
          status: getStatus(types, 'False'),
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
          status: getStatus(flpStatuses, 'False'),
          selected: _.some(selectedTypes, t => flpStatuses.includes(t)),
          onSelect: () => setSelectedTypes(flpStatuses)
        }
      });
    }

    const cpRunAfter: string[] = [];
    if (existing?.spec?.loki?.enable) {
      const types = ['LokiIssue', 'LokiWarning'];
      steps.push({
        id: 'loki',
        label: 'Loki',
        runAfterTasks: ['flp'],
        data: {
          status: getStatus(types, 'False'),
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
          status: overallStatus,
          selected: _.some(selectedTypes, t => overallTypes.includes(t)),
          onSelect: () => setSelectedTypes(overallTypes)
        }
      });
    }

    return steps.map(s => ({
      type: s.type || taskNodeType,
      width: 180,
      height: 32,
      style: {
        padding: [45, 15]
      },
      ...s
    })) as PipelineNodeModel[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.spec, getStatus, selectedTypes, setSelectedTypes]);

  React.useEffect(() => {
    if (containerRef.current) {
      getResizeObserver(
        containerRef.current,
        () => {
          setTimeout(() => fit(), 100); // slight delay to allow for any layout thrashing
        },
        true
      );
    }
  }, [containerRef, controller, fit]);

  const { nodes, edges } = React.useMemo(() => {
    const steps = getSteps();
    const spacerNodes = getSpacerNodes(steps);
    const nodes = [...steps, ...spacerNodes];
    const edges = getEdgesFromNodes(steps);
    return { nodes, edges };
  }, [getSteps]);

  React.useEffect(() => {
    if (!controller) {
      return;
    }

    // Hide graph during layout to prevent visible repositioning
    setIsLayouting(true);

    // Update the model - the layoutEndEvent listener will call fit() when layout completes
    // This ensures layout and fit happen together without visible intermediate states
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
  }, [controller, nodes, edges]);

  //create controller on startup and register factories
  React.useEffect(() => {
    const c = new Visualization();
    c.registerComponentFactory(pipelineComponentFactory);
    c.registerLayoutFactory((type: string, graph: Graph): Layout | undefined => new PipelineDagreLayout(graph));
    setController(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register layout end event listener separately to avoid stale closure
  React.useEffect(() => {
    if (!controller) return;

    const handleLayoutEnd = () => fit();
    controller.addEventListener(layoutEndEvent, handleLayoutEnd);

    return () => {
      controller.removeEventListener(layoutEndEvent, handleLayoutEnd);
    };
  }, [controller, fit]);

  return (
    <div
      id="pipeline-container-div"
      style={{ width: '100%', height: '100%', opacity: isLayouting ? 0 : 1, transition: 'opacity 0.15s ease-in-out' }}
      ref={containerRef}
    >
      <VisualizationProvider controller={controller}>
        <VisualizationSurface />
      </VisualizationProvider>
    </div>
  );
};

export default Pipeline;
