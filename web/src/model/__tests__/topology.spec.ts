import { MetricScopeOptions } from '../metrics';
import { getGroupsForScope, isGroupEnabled } from '../topology';

describe('Check enabled groups', () => {
  it('should filter out disabled groups', () => {
    let groups = getGroupsForScope(MetricScopeOptions.OWNER);
    expect(groups).toEqual([
      'none',
      'clusters',
      'clusters+zones',
      'zones',
      'zones+hosts',
      'zones+namespaces',
      'zones+owners',
      'hosts',
      'hosts+namespaces',
      'namespaces'
    ]);

    groups = groups.filter(g => isGroupEnabled(g, ['host', 'namespace', 'owner', 'zone']));
    expect(groups).toEqual([
      'none',
      'zones',
      'zones+hosts',
      'zones+namespaces',
      'zones+owners',
      'hosts',
      'hosts+namespaces',
      'namespaces'
    ]);
  });
});
