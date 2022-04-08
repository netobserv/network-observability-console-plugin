import { findFilter } from '../filter-definitions';

const t = (k: string) => k;

describe('Resource validation', () => {
  const def = findFilter(t, 'resource')!;

  it('should empty be invalid', () => {
    const validated = def.validate('');
    expect(validated.val).toBeUndefined();
    expect(validated.err).toContain('Incomplete resource name');
  });

  it('should missing parts be invalid', () => {
    const validated = def.validate('Pod.ns');
    expect(validated.val).toBeUndefined();
    expect(validated.err).toContain('Incomplete resource name');
  });

  it('should empty Kind be invalid', () => {
    const validated = def.validate('.ns.name');
    expect(validated.val).toBeUndefined();
    expect(validated.err).toEqual('Kind is empty');
  });

  it('should check k8s name validity', () => {
    const validated = def.validate('Pod.ns.n@me');
    expect(validated.val).toBeUndefined();
    expect(validated.err).toEqual('Name: not a valid Kubernetes name');
  });

  it('should validate', () => {
    const validated = def.validate('Pod.ns.name');
    expect(validated.err).toBeUndefined();
    expect(validated.val).toEqual('Pod.ns.name');
  });

  it('should sanitize kind', () => {
    const validated = def.validate('poD.ns.name');
    expect(validated.err).toBeUndefined();
    expect(validated.val).toEqual('Pod.ns.name');
  });
});

describe('Resource checkCompletion', () => {
  const def = findFilter(t, 'resource')!;

  it('should join selected kind', () => {
    const partial = def.checkCompletion!('', 'Pod');
    expect(partial.completed).toBe(false);
    expect(partial.option).toEqual({ name: 'Pod.', value: 'Pod.' });
  });

  it('should join selected kind with non-empty value', () => {
    const partial = def.checkCompletion!('P', 'Pod');
    expect(partial.completed).toBe(false);
    expect(partial.option).toEqual({ name: 'Pod.', value: 'Pod.' });
  });

  it('should join selected namespace', () => {
    const partial = def.checkCompletion!('Pod.', 'network-observability');
    expect(partial.completed).toBe(false);
    expect(partial.option).toEqual({ name: 'Pod.network-observability.', value: 'Pod.network-observability.' });
  });

  it('should join selected namespace with non-empty value', () => {
    const partial = def.checkCompletion!('Pod.netw', 'network-observability');
    expect(partial.completed).toBe(false);
    expect(partial.option).toEqual({ name: 'Pod.network-observability.', value: 'Pod.network-observability.' });
  });

  it('should join selected name and be completed', () => {
    const partial = def.checkCompletion!('Pod.network-observability.', 'loki-0');
    expect(partial.completed).toBe(true);
    expect(partial.option).toEqual({
      name: 'Pod.network-observability.loki-0',
      value: 'Pod.network-observability.loki-0'
    });
  });

  it('should join selected name with non-empty value and be completed', () => {
    const partial = def.checkCompletion!('Pod.network-observability.lok', 'loki-0');
    expect(partial.completed).toBe(true);
    expect(partial.option).toEqual({
      name: 'Pod.network-observability.loki-0',
      value: 'Pod.network-observability.loki-0'
    });
  });

  it('should join selected name for Node and be completed', () => {
    const partial = def.checkCompletion!('Node.', 'abcd');
    expect(partial.completed).toBe(true);
    expect(partial.option).toEqual({ name: 'Node.abcd', value: 'Node.abcd' });
  });

  it('should join selected name for Node with non-empty value and be completed', () => {
    const partial = def.checkCompletion!('Node.a', 'abcd');
    expect(partial.completed).toBe(true);
    expect(partial.option).toEqual({ name: 'Node.abcd', value: 'Node.abcd' });
  });
});
