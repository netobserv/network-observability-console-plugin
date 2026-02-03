import { ColumnConfigSampleDefs } from '../../components/__tests-data__/columns';
import { FilterConfigSampleDefs, FilterDefinitionSample } from '../../components/__tests-data__/filters';
import { Config, Feature } from '../../model/config';
import { checkFilterAvailable, findFilter } from '../filter-definitions';

describe('Resource validation', () => {
  const def = findFilter(FilterDefinitionSample, 'src_resource')!;

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
  const def = findFilter(FilterDefinitionSample, 'src_resource')!;

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

describe('Check availability for prometheus only', () => {
  const simpleFilter = findFilter(FilterDefinitionSample, 'src_name')!;
  const k8sFilter = findFilter(FilterDefinitionSample, 'src_resource')!;
  const getConfig = (promLabels: string[]): Config => {
    return { promLabels, dataSources: ['prom'] } as Config;
  };

  it('should be available', () => {
    let available = checkFilterAvailable(simpleFilter, getConfig(['SrcK8S_Name', 'DstK8S_Name']), 'prom');
    expect(available).toBe(true);

    available = checkFilterAvailable(
      k8sFilter,
      getConfig([
        'SrcK8S_OwnerName',
        'SrcK8S_OwnerType',
        'SrcK8S_Namespace',
        'DstK8S_OwnerName',
        'DstK8S_OwnerType',
        'DstK8S_Namespace'
      ]),
      'prom'
    );
    expect(available).toBe(true);
  });

  it('should not be available', () => {
    let available = checkFilterAvailable(simpleFilter, getConfig(['SrcK8S_OwnerName', 'DstK8S_OwnerName']), 'prom');
    expect(available).toBe(false);

    available = checkFilterAvailable(
      k8sFilter,
      getConfig(['SrcK8S_OwnerName', 'SrcK8S_Namespace', 'DstK8S_OwnerName', 'DstK8S_Namespace']),
      'prom'
    );
    expect(available).toBe(false);
  });
});

describe('Check availability against features', () => {
  const getConfig = (feats: Feature[]): Config => {
    return {
      features: feats,
      dataSources: ['loki'],
      columns: ColumnConfigSampleDefs,
      filters: FilterConfigSampleDefs
    } as Config;
  };

  it('with standard filters', () => {
    const simpleFilter = findFilter(FilterDefinitionSample, 'src_name')!;
    const k8sFilter = findFilter(FilterDefinitionSample, 'src_resource')!;

    let available = checkFilterAvailable(simpleFilter, getConfig([]), 'auto');
    expect(available).toBe(true);

    available = checkFilterAvailable(k8sFilter, getConfig([]), 'auto');
    expect(available).toBe(true);

    available = checkFilterAvailable(simpleFilter, getConfig(['dnsTracking']), 'auto');
    expect(available).toBe(true);

    available = checkFilterAvailable(k8sFilter, getConfig(['dnsTracking']), 'auto');
    expect(available).toBe(true);
  });

  it('with AZ filters', () => {
    const srcZoneFilter = findFilter(FilterDefinitionSample, 'src_zone')!;
    const zoneFilter = findFilter(FilterDefinitionSample, 'zone')!;

    // Test that zone filters are unavailable without zones feature
    let available = checkFilterAvailable(srcZoneFilter, getConfig([]), 'auto');
    expect(available).toBe(false);
    available = checkFilterAvailable(zoneFilter, getConfig([]), 'auto');
    expect(available).toBe(false);

    // Test that zone filters are unavailable with other features
    available = checkFilterAvailable(srcZoneFilter, getConfig(['dnsTracking']), 'auto');
    expect(available).toBe(false);
    available = checkFilterAvailable(zoneFilter, getConfig(['dnsTracking']), 'auto');
    expect(available).toBe(false);

    // Test that zone filters are available with zones feature
    available = checkFilterAvailable(srcZoneFilter, getConfig(['zones']), 'auto');
    expect(available).toBe(true);
    available = checkFilterAvailable(zoneFilter, getConfig(['zones']), 'auto');
    expect(available).toBe(true);
  });

  it('with DNS filters', () => {
    const dnsIdFilter = findFilter(FilterDefinitionSample, 'dns_id')!;
    const dnsLatilter = findFilter(FilterDefinitionSample, 'dns_latency')!;

    let available = checkFilterAvailable(dnsIdFilter, getConfig([]), 'auto');
    expect(available).toBe(false);
    available = checkFilterAvailable(dnsLatilter, getConfig([]), 'auto');
    expect(available).toBe(false);

    available = checkFilterAvailable(dnsIdFilter, getConfig(['dnsTracking']), 'auto');
    expect(available).toBe(true);
    available = checkFilterAvailable(dnsLatilter, getConfig(['dnsTracking']), 'auto');
    expect(available).toBe(true);
  });
});

describe('Check endpoint filters availability with Prometheus only', () => {
  const getConfig = (promLabels: string[], dataSources: string[] = ['prom']): Config => {
    return { promLabels, dataSources, columns: ColumnConfigSampleDefs } as Config;
  };

  it('should be available when both src_ and dst_ variants are available', () => {
    const namespaceFilter = findFilter(FilterDefinitionSample, 'namespace')!;
    const nameFilter = findFilter(FilterDefinitionSample, 'name')!;

    // Both src and dst variants have their labels available
    const available = checkFilterAvailable(
      namespaceFilter,
      getConfig(['SrcK8S_Namespace', 'DstK8S_Namespace']),
      'prom',
      FilterDefinitionSample
    );
    expect(available).toBe(true);

    const nameAvailable = checkFilterAvailable(
      nameFilter,
      getConfig(['SrcK8S_Name', 'DstK8S_Name']),
      'prom',
      FilterDefinitionSample
    );
    expect(nameAvailable).toBe(true);
  });

  it('should not be available when variants are missing', () => {
    const namespaceFilter = findFilter(FilterDefinitionSample, 'namespace')!;

    // Neither src_ nor dst_ variant available
    const available = checkFilterAvailable(namespaceFilter, getConfig([]), 'prom', FilterDefinitionSample);
    expect(available).toBe(false);
  });

  it('should be available with Loki enabled', () => {
    const namespaceFilter = findFilter(FilterDefinitionSample, 'namespace')!;

    // With Loki, endpoint filters follow the default behavior
    const available = checkFilterAvailable(namespaceFilter, getConfig([], ['loki']), 'auto', FilterDefinitionSample);
    // Should fall through to default "allow by default" behavior
    expect(available).toBe(true);
  });
});
