import { ScopeDefSample } from '../../components/__tests-data__/scopes';
import { ContextSingleton } from '../../utils/context';
import { getGroupName, getGroupsForScope, getStepInto } from '../scope';

describe('Check enabled groups', () => {
  beforeEach(() => {
    ContextSingleton.setScopes(ScopeDefSample);
  });

  it('should get group from scope', () => {
    let groups = getGroupsForScope('cluster', ScopeDefSample);
    expect(groups).toEqual(['none']);

    groups = getGroupsForScope('host', ScopeDefSample);
    expect(groups).toEqual(['none', 'clusters', 'zones', 'clusters+zones']);

    groups = getGroupsForScope('owner', ScopeDefSample);
    expect(groups).toEqual([
      'none',
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
