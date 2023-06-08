import * as _ from 'lodash';
import { TFunction } from 'i18next';
import { getPort } from '../utils/port';
import { validateK8SName, validateStrictK8SName } from './label';
import { joinResource, SplitResource, splitResource, SplitStage } from '../model/resource';
import { validateIPFilter } from './ip';
import { Fields, Labels } from '../api/ipfix';
import {
  FilterId,
  FilterValue,
  FilterDefinition,
  FilterCategory,
  FilterComponent,
  FiltersEncoder
} from '../model/filters';
import {
  findProtocolOption,
  getKindOptions,
  getNamespaceOptions,
  getPortOptions,
  getProtocolOptions,
  getResourceOptions,
  noOption,
  cap10
} from './filter-options';

// Convenience string to filter by undefined field values
export const undefinedValue = '""';

type Field = keyof Fields | keyof Labels;

const matcher = (left: string, right: string[], not: boolean) => `${left}${not ? '!=' : '='}${right.join(',')}`;

const simpleFiltersEncoder = (field: Field): FiltersEncoder => {
  return (values: FilterValue[], matchAny: boolean, not: boolean) => {
    return matcher(
      field,
      values.map(v => v.v),
      not
    );
  };
};

// As owner / non-owner kind filters are mixed, they are disambiguated via this function
const kindFiltersEncoder = (base: Field, owner: Field): FiltersEncoder => {
  return (values: FilterValue[], matchAny: boolean, not: boolean) => {
    const { baseValues, ownerValues } = _.groupBy(values, value => {
      return isOwnerKind(value.v) ? 'ownerValues' : 'baseValues';
    });
    const filters: string[] = [];
    if (baseValues && baseValues.length > 0) {
      filters.push(
        matcher(
          base,
          baseValues.map(value => value.v),
          not
        )
      );
    }
    if (ownerValues && ownerValues.length > 0) {
      filters.push(
        matcher(
          owner,
          ownerValues.map(value => value.v),
          not
        )
      );
    }
    return filters.join(matchAny ? '|' : '&');
  };
};

const k8sResourceFiltersEncoder = (
  kind: Field,
  ownerKind: Field,
  namespace: Field,
  name: Field,
  ownerName: Field
): FiltersEncoder => {
  return (values: FilterValue[], matchAny: boolean, not: boolean) => {
    const splitValues = values.map(value => splitResource(value.v));
    return splitValues
      .map(res => {
        if (isOwnerKind(res.kind)) {
          return k8sSingleResourceEncode(ownerKind, namespace, ownerName, res, not);
        } else {
          return k8sSingleResourceEncode(kind, namespace, name, res, not);
        }
      })
      .join(matchAny ? '|' : '&');
  };
};

const k8sSingleResourceEncode = (kind: Field, namespace: Field, name: Field, res: SplitResource, not: boolean) => {
  if (not) {
    return `${kind}!="${res.kind}"|${namespace}!="${res.namespace}"|${name}!="${res.name}"`;
  }
  return `${kind}="${res.kind}"&${namespace}="${res.namespace}"&${name}="${res.name}"`;
};

const peers = (
  base: Omit<FilterDefinition, 'encoders'>,
  srcEncoder: FiltersEncoder,
  dstEncoder: FiltersEncoder
): FilterDefinition[] => {
  return [
    {
      ...base,
      id: ('src_' + base.id) as FilterId,
      category: FilterCategory.Source,
      encoders: { simpleEncode: srcEncoder }
    },
    {
      ...base,
      id: ('dst_' + base.id) as FilterId,
      category: FilterCategory.Destination,
      encoders: { simpleEncode: dstEncoder }
    },
    {
      ...base,
      category: FilterCategory.Common,
      encoders: { common: { srcEncode: srcEncoder, dstEncode: dstEncoder } }
    }
  ];
};

const peersWithOverlap = (
  base: Omit<FilterDefinition, 'encoders'>,
  srcEncoder: FiltersEncoder,
  dstEncoder: FiltersEncoder
): FilterDefinition[] => {
  const defs = peers(base, srcEncoder, dstEncoder);
  // Modify Common (defs[2]) filter encoder to exclude overlap between src and dest matches
  defs[2].encoders.common!.dstEncode = (values: FilterValue[], matchAny: boolean, not: boolean) => {
    // Stands for: ... OR (<dst filters> AND NOT <src filters>)
    return dstEncoder(values, matchAny, not) + '&' + srcEncoder(values, matchAny, !not);
  };
  return defs;
};

const isOwnerKind = (kind: string) => {
  const lower = kind.toLowerCase();
  return (
    lower !== 'pod' &&
    lower !== 'service' &&
    lower !== 'node' &&
    lower !== '"pod"' &&
    lower !== '"service"' &&
    lower !== '"node"'
  );
};

const valid = (newValue: string) => ({ val: newValue });
const invalid = (msg: string) => ({ err: msg });

let filterDefinitions: FilterDefinition[] | undefined = undefined;
export const getFilterDefinitions = (t: TFunction, allowConnectionFilter?: boolean): FilterDefinition[] => {
  if (!filterDefinitions) {
    const rejectEmptyValue = (value: string) => {
      if (_.isEmpty(value)) {
        return invalid(t('Value is empty'));
      }
      return valid(value);
    };
    const k8sNameValidation = (value: string) => {
      if (_.isEmpty(value)) {
        // Replace with exact match
        return valid('""');
      }
      return value === '""' || validateK8SName(value) ? valid(value) : invalid(t('Not a valid Kubernetes name'));
    };

    // Many texts here, temporary disabled rule
    /* eslint-disable max-len */
    const k8sNameHint = t('Specify a single kubernetes name.');
    const k8sNameExamples = `${t('Specify a single kubernetes name following these rules:')}
    - ${t('Containing any alphanumeric, hyphen, underscrore or dot character')}
    - ${t('Partial text like cluster, cluster-image, image-registry')}
    - ${t('Exact match using quotes like "cluster-image-registry"')}
    - ${t('Case sensitive match using quotes like "Deployment"')}
    - ${t('Starting text like cluster, "cluster-*"')}
    - ${t('Ending text like "*-registry"')}
    - ${t('Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-')}`;

    const ipHint = t('Specify a single IP or range.');
    const ipExamples = `${t('Specify IP following one of these rules:')}
    - ${t('A single IPv4 or IPv6 address like 192.0.2.0, ::1')}
    - ${t('An IP address range like 192.168.0.1-192.189.10.12, 2001:db8::1-2001:db8::8')}
    - ${t('A CIDR specification like 192.51.100.0/24, 2001:db8::/32')}
    - ${t('Empty double quotes "" for an empty IP')}`;

    const invalidIPMessage = t('Not a valid IPv4 or IPv6, nor a CIDR, nor an IP range separated by hyphen');
    const invalidMACMessage = t('Not a valid MAC address');

    filterDefinitions = [
      ...peersWithOverlap(
        {
          id: 'namespace',
          name: t('Namespace'),
          component: FilterComponent.Autocomplete,
          autoCompleteAddsQuotes: true,
          category: FilterCategory.Common,
          getOptions: cap10(getNamespaceOptions),
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples
        },
        simpleFiltersEncoder('SrcK8S_Namespace'),
        simpleFiltersEncoder('DstK8S_Namespace')
      ),
      ...peers(
        {
          id: 'name',
          name: t('Name'),
          component: FilterComponent.Text,
          category: FilterCategory.Common,
          getOptions: noOption,
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples
        },
        simpleFiltersEncoder('SrcK8S_Name'),
        simpleFiltersEncoder('DstK8S_Name')
      ),
      ...peers(
        {
          id: 'kind',
          name: t('Kind'),
          component: FilterComponent.Autocomplete,
          autoCompleteAddsQuotes: true,
          category: FilterCategory.Common,
          getOptions: cap10(getKindOptions),
          validate: rejectEmptyValue
        },
        kindFiltersEncoder('SrcK8S_Type', 'SrcK8S_OwnerType'),
        kindFiltersEncoder('DstK8S_Type', 'DstK8S_OwnerType')
      ),
      ...peersWithOverlap(
        {
          id: 'owner_name',
          name: t('Owner Name'),
          component: FilterComponent.Text,
          category: FilterCategory.Common,
          getOptions: noOption,
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples
        },
        simpleFiltersEncoder('SrcK8S_OwnerName'),
        simpleFiltersEncoder('DstK8S_OwnerName')
      ),
      ...peers(
        {
          id: 'resource',
          name: t('Resource'),
          component: FilterComponent.Autocomplete,
          category: FilterCategory.Common,
          getOptions: cap10(getResourceOptions),
          validate: (value: string) => {
            const resource = splitResource(value);
            if (resource.stage !== SplitStage.Completed) {
              return invalid(t('Incomplete resource name, either kind, namespace or name is missing.'));
            }
            if (resource.kind === '') {
              return invalid(t('Kind is empty'));
            }
            if (resource.namespace && !validateStrictK8SName(resource.namespace)) {
              return invalid(t('Namespace: not a valid Kubernetes name'));
            }
            if (!validateStrictK8SName(resource.name)) {
              return invalid(t('Name: not a valid Kubernetes name'));
            }
            // Make sure kind first letter is capital, rest is lower case
            resource.kind = resource.kind.charAt(0).toUpperCase() + resource.kind.slice(1).toLowerCase();
            return valid(joinResource(resource));
          },
          checkCompletion: (value: string, selected: string) => {
            const parts = splitResource(value);
            switch (parts.stage) {
              case SplitStage.PartialKind: {
                const joined = `${selected}.`;
                return { completed: false, option: { name: joined, value: joined } };
              }
              case SplitStage.PartialNamespace: {
                const joined = `${parts.kind}.${selected}.`;
                return { completed: false, option: { name: joined, value: joined } };
              }
              case SplitStage.Completed: {
                const joined = joinResource({ ...parts, name: selected });
                return { completed: true, option: { name: joined, value: joined } };
              }
            }
          },
          placeholder: 'E.g: Pod.default.my-pod',
          hint: t('Specify an existing resource from its kind, namespace and name.'),
          examples: `${t('Specify a kind, namespace and name from existing:')}
        - ${t('Select kind first from suggestions')}
        - ${t('Then Select namespace from suggestions')}
        - ${t('Finally select name from suggestions')}
        ${t('You can also directly specify a kind, namespace and name like pod.openshift.apiserver')}`
        },
        k8sResourceFiltersEncoder(
          'SrcK8S_Type',
          'SrcK8S_OwnerType',
          'SrcK8S_Namespace',
          'SrcK8S_Name',
          'SrcK8S_OwnerName'
        ),
        k8sResourceFiltersEncoder(
          'DstK8S_Type',
          'DstK8S_OwnerType',
          'DstK8S_Namespace',
          'DstK8S_Name',
          'DstK8S_OwnerName'
        )
      ),
      ...peers(
        {
          id: 'address',
          name: t('IP'),
          component: FilterComponent.Text,
          category: FilterCategory.Common,
          getOptions: noOption,
          validate: (value: string) => {
            if (_.isEmpty(value)) {
              return invalid(t('Value is empty'));
            }
            return validateIPFilter(value) ? valid(value) : invalid(invalidIPMessage);
          },
          hint: ipHint,
          examples: ipExamples
        },
        simpleFiltersEncoder('SrcAddr'),
        simpleFiltersEncoder('DstAddr')
      ),
      ...peers(
        {
          id: 'port',
          name: t('Port'),
          component: FilterComponent.Autocomplete,
          category: FilterCategory.Common,
          getOptions: cap10(getPortOptions),
          validate: (value: string) => {
            if (_.isEmpty(value)) {
              return invalid(t('Value is empty'));
            }
            //allow any port number or valid name / value
            if (value == undefinedValue || !isNaN(Number(value)) || getPort(value)) {
              return valid(value);
            }
            return invalid(t('Unknown port'));
          },
          hint: t('Specify a single port number or name.'),
          examples: `${t('Specify a single port following one of these rules:')}
        - ${t('A port number like 80, 21')}
        - ${t('A IANA name like HTTP, FTP')}
        - ${t('Empty double quotes "" for undefined port')}`
        },
        simpleFiltersEncoder('SrcPort'),
        simpleFiltersEncoder('DstPort')
      ),
      ...peers(
        {
          id: 'mac',
          name: t('MAC'),
          component: FilterComponent.Text,
          category: FilterCategory.Common,
          getOptions: noOption,
          validate: (value: string) => {
            if (_.isEmpty(value)) {
              return invalid(t('Value is empty'));
            }
            return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/.test(value) ? valid(value) : invalid(invalidMACMessage);
          },
          hint: t('Specify a single MAC address.')
        },
        simpleFiltersEncoder('SrcMac'),
        simpleFiltersEncoder('DstMac')
      ),
      ...peers(
        {
          id: 'host_address',
          name: t('Node IP'),
          component: FilterComponent.Text,
          category: FilterCategory.Common,
          getOptions: noOption,
          validate: (value: string) => {
            if (_.isEmpty(value)) {
              return invalid(t('Value is empty'));
            }
            return validateIPFilter(value) ? valid(value) : invalid(invalidIPMessage);
          },
          hint: ipHint,
          examples: ipExamples
        },
        simpleFiltersEncoder('SrcK8S_HostIP'),
        simpleFiltersEncoder('DstK8S_HostIP')
      ),
      ...peersWithOverlap(
        {
          id: 'host_name',
          name: t('Node Name'),
          component: FilterComponent.Text,
          category: FilterCategory.Common,
          getOptions: noOption,
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples
        },
        simpleFiltersEncoder('SrcK8S_HostName'),
        simpleFiltersEncoder('DstK8S_HostName')
      ),
      {
        id: 'protocol',
        name: t('Protocol'),
        category: FilterCategory.None,
        component: FilterComponent.Autocomplete,
        getOptions: cap10(getProtocolOptions),
        validate: (value: string) => {
          if (_.isEmpty(value)) {
            return invalid(t('Value is empty'));
          }
          //allow any protocol number or valid name / value
          if (value == undefinedValue || !isNaN(Number(value))) {
            return valid(value);
          } else {
            const proto = findProtocolOption(value);
            if (proto) {
              return valid(proto.name);
            }
            return invalid(t('Unknown protocol'));
          }
        },
        hint: t('Specify a single protocol number or name.'),
        examples: `${t('Specify a single protocol following one of these rules:')}
        - ${t('A protocol number like 6, 17')}
        - ${t('A IANA name like TCP, UDP')}
        - ${t('Empty double quotes "" for undefined protocol')}`,
        encoders: { simpleEncode: simpleFiltersEncoder('Proto') }
      },
      {
        id: 'interface',
        name: t('Network interface'),
        category: FilterCategory.None,
        component: FilterComponent.Text,
        getOptions: noOption,
        validate: rejectEmptyValue,
        hint: t('Specify a network interface.'),
        encoders: { simpleEncode: simpleFiltersEncoder('Interface') }
      },
      {
        id: 'id',
        name: t('Conversation Id'),
        category: FilterCategory.None,
        component: FilterComponent.Text,
        getOptions: noOption,
        validate: rejectEmptyValue,
        hint: t('Specify a single conversation hash Id.'),
        encoders: { simpleEncode: simpleFiltersEncoder('_HashId') }
      },
      {
        id: 'dns_id',
        name: t('DNS Id'),
        category: FilterCategory.None,
        component: FilterComponent.Text,
        getOptions: noOption,
        validate: rejectEmptyValue,
        hint: t('Specify a single DNS Id.'),
        encoders: { simpleEncode: simpleFiltersEncoder('DnsId') }
      }
    ];
  }

  if (allowConnectionFilter) {
    return filterDefinitions;
  } else {
    return filterDefinitions.filter(fd => fd.id !== 'id');
  }
};
/* eslint-enable max-len */

export const findFilter = (t: TFunction, id: FilterId) => getFilterDefinitions(t, true).find(def => def.id === id);
