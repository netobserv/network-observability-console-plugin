import { ScopeDefSample } from '../../components/__tests-data__/scopes';
import { getGroupName, getGroupsForScope } from '../scope';

describe('Check enabled groups', () => {
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
});
