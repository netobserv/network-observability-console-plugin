import { splitResource, SplitStage } from '../resource';

describe('splitResource', () => {
  it('should split partial kind', () => {
    const split = splitResource('Po');
    expect(split.stage).toEqual(SplitStage.PartialKind);
    expect(split.kind).toEqual('Po');
    expect(split.namespace).toEqual('');
    expect(split.name).toEqual('');
  });

  it('should split partial empty namespace', () => {
    const split = splitResource('Pod.');
    expect(split.stage).toEqual(SplitStage.PartialNamespace);
    expect(split.kind).toEqual('Pod');
    expect(split.namespace).toEqual('');
    expect(split.name).toEqual('');
  });

  it('should split partial namespace', () => {
    const split = splitResource('Pod.d');
    expect(split.stage).toEqual(SplitStage.PartialNamespace);
    expect(split.kind).toEqual('Pod');
    expect(split.namespace).toEqual('d');
    expect(split.name).toEqual('');
  });

  it('should split empty name', () => {
    const split = splitResource('Pod.default.');
    expect(split.stage).toEqual(SplitStage.Completed);
    expect(split.kind).toEqual('Pod');
    expect(split.namespace).toEqual('default');
    expect(split.name).toEqual('');
  });

  it('should split completed', () => {
    const split = splitResource('Pod.default.test');
    expect(split.stage).toEqual(SplitStage.Completed);
    expect(split.kind).toEqual('Pod');
    expect(split.namespace).toEqual('default');
    expect(split.name).toEqual('test');
  });

  it('should split partial empty node', () => {
    const split = splitResource('Node.');
    expect(split.stage).toEqual(SplitStage.Completed);
    expect(split.kind).toEqual('Node');
    expect(split.namespace).toEqual('');
    expect(split.name).toEqual('');
  });

  it('should split completed node', () => {
    const split = splitResource('Node.my-node.ec2.internal');
    expect(split.stage).toEqual(SplitStage.Completed);
    expect(split.kind).toEqual('Node');
    expect(split.namespace).toEqual('');
    expect(split.name).toEqual('my-node.ec2.internal');
  });
});
