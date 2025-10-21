import { ScopeDefSample } from '../../components/__tests-data__/scopes';
import { ContextSingleton } from '../../utils/context';
import { getGroupName, getGroupsForScope, getStepInto, resolveGroupTypes } from '../scope';

describe('Check enabled groups', () => {
  beforeEach(() => {
    ContextSingleton.setScopes(ScopeDefSample);
  });

  it('should get group from scope', () => {
    let groups = getGroupsForScope('cluster', ScopeDefSample);
    expect(groups).toEqual(['none', 'auto']);

    groups = getGroupsForScope('host', ScopeDefSample);
    expect(groups).toEqual(['none', 'auto', 'clusters', 'zones', 'clusters+zones']);

    groups = getGroupsForScope('owner', ScopeDefSample);
    expect(groups).toEqual([
      'none',
      'auto',
      'clusters',
      'clusters+zones',
      'clusters+hosts',
      'clusters+namespaces',
      'zones',
      'zones+hosts',
      'zones+namespaces',
      'hosts',
      'hosts+namespaces',
      'namespaces'
    ]);
  });

  it('should resolve auto group', () => {
    let group = resolveGroupTypes('auto', 'resource', ScopeDefSample);
    expect(group).toEqual('namespaces');

    group = resolveGroupTypes('auto', 'owner', ScopeDefSample);
    expect(group).toEqual('namespaces');

    group = resolveGroupTypes('auto', 'namespace', ScopeDefSample);
    expect(group).toEqual('none');

    group = resolveGroupTypes('auto', 'host', ScopeDefSample);
    expect(group).toEqual('none');

    group = resolveGroupTypes('hosts', 'resource', ScopeDefSample);
    expect(group).toEqual('hosts');
  });

  it('should get group name', () => {
    let name = getGroupName('hosts', ScopeDefSample, (s: string) => s);
    expect(name).toEqual('Node');

    name = getGroupName('zones+hosts', ScopeDefSample, (s: string) => s);
    expect(name).toEqual('Zone + Node');

    name = getGroupName('namespaces', ScopeDefSample, (s: string) => s);
    expect(name).toEqual('Namespace');

    name = getGroupName('zzz', ScopeDefSample, (s: string) => s);
    expect(name).toEqual('invalid zzz');

    name = getGroupName('namespaces+zzz', ScopeDefSample, (s: string) => s);
    expect(name).toEqual('Namespace + invalid zzz');
  });

  it('should get next scope', () => {
    let next = getStepInto('cluster', ['cluster', 'zone', 'host', 'namespace', 'owner', 'resource']);
    expect(next).toEqual('zone');

    next = getStepInto('cluster', ['cluster', 'host']);
    expect(next).toEqual('host');

    next = getStepInto('cluster', ['cluster']);
    expect(next).toEqual(undefined);

    next = getStepInto('resource', ['cluster', 'zone', 'host', 'namespace', 'owner', 'resource']);
    expect(next).toEqual(undefined);
  });
});
