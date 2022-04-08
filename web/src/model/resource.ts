export enum SplitStage {
  PartialKind,
  PartialNamespace,
  Completed
}
type SplitResource = { kind: string; namespace: string; name: string; stage: SplitStage };

const isNode = (kind: string) => kind.toLowerCase() === 'node';

export const splitResource = (resource: string): SplitResource => {
  const parts = resource.split('.');
  if (parts.length === 1) {
    return { kind: parts[0], namespace: '', name: '', stage: SplitStage.PartialKind };
  } else if (parts.length === 2) {
    if (isNode(parts[0])) {
      // Node is not namespace-scoped
      return { kind: parts[0], namespace: '', name: parts[1], stage: SplitStage.Completed };
    }
    return { kind: parts[0], namespace: parts[1], name: '', stage: SplitStage.PartialNamespace };
  }
  return { kind: parts[0], namespace: parts[1], name: parts[2], stage: SplitStage.Completed };
};

export const joinResource = (resource: SplitResource): string => {
  if (isNode(resource.kind)) {
    return `${resource.kind}.${resource.name}`;
  }
  return `${resource.kind}.${resource.namespace}.${resource.name}`;
};
