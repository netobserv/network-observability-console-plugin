export enum SplitStage {
  PartialKind,
  PartialNamespace,
  Completed
}
type SplitResource = { kind: string; namespace: string; name: string; stage: SplitStage };

const isNode = (kind: string) => kind.toLowerCase() === 'node';

export const splitResource = (resource: string): SplitResource => {
  const [kind, ...rest] = resource.split('.');
  if (rest.length === 0) {
    return { kind: kind, namespace: '', name: '', stage: SplitStage.PartialKind };
  }
  if (isNode(kind)) {
    // Node is not namespace-scoped; beware that it may contain dots, unlike usual names
    return { kind: kind, namespace: '', name: rest.join('.'), stage: SplitStage.Completed };
  }
  if (rest.length === 1) {
    return { kind: kind, namespace: rest[0], name: '', stage: SplitStage.PartialNamespace };
  }
  return { kind: kind, namespace: rest[0], name: rest[1], stage: SplitStage.Completed };
};

export const joinResource = (resource: SplitResource): string => {
  if (isNode(resource.kind)) {
    return `${resource.kind}.${resource.name}`;
  }
  return `${resource.kind}.${resource.namespace}.${resource.name}`;
};
