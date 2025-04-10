import {
  DEFAULT_EDGE_TYPE,
  DEFAULT_FINALLY_NODE_TYPE,
  DEFAULT_SPACER_NODE_TYPE,
  DEFAULT_TASK_NODE_TYPE,
  DEFAULT_WHEN_OFFSET,
  DefaultTaskGroup,
  FinallyNode,
  Graph,
  GraphComponent,
  Layout,
  Model,
  ModelKind,
  Node,
  PipelineDagreLayout,
  PipelineNodeModel,
  RunStatus,
  SpacerNode,
  TaskEdge,
  TaskNode,
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  WhenDecorator,
  getEdgesFromNodes,
  getSpacerNodes,
  useVisualizationController
} from '@patternfly/react-topology';
import * as React from 'react';

export interface Step {
  id: string;
  type?: string;
  label: string;
  runAfterTasks?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

const steps: Step[] = [
  {
    id: 'ebpf',
    label: 'eBPF agents',
    data: {
      status: RunStatus.Succeeded
    }
  },
  {
    id: 'kafka',
    label: 'Kafka',
    runAfterTasks: ['ebpf'],
  },
  {
    id: 'flp',
    label: 'Flowlogs pipeline',
    runAfterTasks: ['kafka'],
    data: {
      status: RunStatus.Succeeded
    }
  },
  {
    id: 'loki',
    label: 'Loki',
    runAfterTasks: ['flp'],
  },
  {
    id: 'prom',
    label: 'Prometheus',
    runAfterTasks: ['flp'],
  },
  {
    id: 'exporter-1',
    label: 'OpenTelemetry',
    runAfterTasks: ['flp'],
  },
  {
    id: 'exporter-2',
    label: 'Kafka',
    runAfterTasks: ['flp'],
  },
  {
    id: 'exporter-3',
    label: 'IPFIX',
    runAfterTasks: ['flp'],
  },
  {
    id: 'plugin',
    label: 'Console plugin',
    runAfterTasks: ['loki', 'prom'],
    data: {
      status: RunStatus.Succeeded
    }
  },
];

const getSteps = () => {
  return steps.map(s => ({
    type: s.type || 'DEFAULT_TASK_NODE',
    width: 180,
    height: 32,
    style: {
      padding: [45, 15]
    },
    ...s
  })) as PipelineNodeModel[];
};

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

export const PipelineSteps: React.FC = () => {
  const controller = useVisualizationController();
  React.useEffect(() => {
    controller.fromModel(
      {
        graph: {
          id: 'g1',
          type: 'graph'
        },
        nodes: getSteps()
      },
      false
    );
  }, [controller]);

  return (
    <TopologyView>
      <VisualizationSurface />
    </TopologyView>
  );
};

PipelineSteps.displayName = 'PipelineSteps';

export const Pipeline: React.FC = () => {
  const controller = new Visualization();
  controller.setFitToScreenOnLayout(true);
  controller.registerComponentFactory(pipelineComponentFactory);
  controller.registerLayoutFactory((type: string, graph: Graph): Layout | undefined => new PipelineDagreLayout(graph));
  const spacerNodes = getSpacerNodes(getSteps());
  const nodes = [...getSteps(), ...spacerNodes];
  const edges = getEdgesFromNodes(getSteps());

  const model: Model = {
    nodes,
    edges,
    graph: {
      id: 'g1',
      type: 'graph',
      layout: 'pipelineLayout'
    }
  };

  controller.fromModel(model, false);

  return (
    <VisualizationProvider controller={controller}>
      <VisualizationSurface />
    </VisualizationProvider>
  );
};

export default Pipeline;