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
    <TaskNode element={element} status={data?.status}>
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
};

export const Pipeline: React.FC<FlowCollectorPipelineProps> = ({ existing }) => {
  const [controller, setController] = React.useState<Visualization>();

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
      steps.push({
        id: 'ebpf',
        label: 'eBPF agents',
        data: {
          status: getStatus(['Ready'], K8sResourceConditionStatus.True)
        }
      });
    }

    const flpStatuses = ['WaitingFLPParent', 'WaitingFLPMonolith'];
    if (existing?.spec?.deploymentModel === 'Kafka') {
      steps.push({
        id: 'kafka',
        label: 'Kafka',
        runAfterTasks: ['ebpf']
      });
      flpStatuses.push('WaitingFLPTransformer');
    }

    if (existing?.spec) {
      steps.push({
        id: 'flp',
        label: 'Flowlogs pipeline',
        runAfterTasks: [_.last(steps)!.id],
        data: {
          status: getStatus(flpStatuses, K8sResourceConditionStatus.False)
        }
      });
    }

    const cpRunAfter: string[] = [];
    if (existing?.spec?.loki?.enable) {
      steps.push({
        id: 'loki',
        label: 'Loki',
        runAfterTasks: ['flp'],
        data: {
          status: getStatus(['LokiIssue'], 'NoIssue') // TODO: NoIssue / Unknown is not a valid status. That should be False.
        }
      });
      cpRunAfter.push('loki');
    }

    if (existing?.spec?.prometheus?.querier?.enable) {
      steps.push({
        id: 'prom',
        label: 'Prometheus',
        runAfterTasks: ['flp']
      });
      cpRunAfter.push('prom');
    }

    if (existing?.spec?.exporters?.length) {
      existing.spec.exporters.forEach((exporter: any, i: number) => {
        steps.push({
          id: `exporter-${i}`,
          label: exporter.type || t('Unknown'),
          runAfterTasks: ['flp']
        });
      });
    }

    if (existing?.spec?.consolePlugin?.enable && cpRunAfter.length) {
      steps.push({
        id: 'plugin',
        label: 'Console plugin',
        runAfterTasks: cpRunAfter
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
  }, [existing, getStatus]);

  React.useEffect(() => {
    const steps = getSteps();
    const spacerNodes = getSpacerNodes(steps);
    const nodes = [...steps, ...spacerNodes];
    const edges = getEdgesFromNodes(steps);
    controller?.fromModel(
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
    c.setFitToScreenOnLayout(true);
    setController(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VisualizationProvider controller={controller}>
      <VisualizationSurface />
    </VisualizationProvider>
  );
};

export default Pipeline;
