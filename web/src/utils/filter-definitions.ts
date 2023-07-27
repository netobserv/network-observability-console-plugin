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
  cap10,
  getDnsResponseCodeOptions,
  getDropStateOptions,
  getDropCauseOptions
} from './filter-options';

// Convenience string to filter by undefined field values
export const undefinedValue = '""';

type Field = keyof Fields | keyof Labels;

const matcher = (left: string, right: string[], not: boolean, moreThan: boolean) =>
  `${left}${not ? '!=' : moreThan ? '>=' : '='}${right.join(',')}`;

const simpleFiltersEncoder = (field: Field): FiltersEncoder => {
  return (values: FilterValue[], matchAny: boolean, not: boolean, moreThan: boolean) => {
    return matcher(
      field,
      values.map(v => v.v),
      not,
      moreThan || false
    );
  };
};

// As owner / non-owner kind filters are mixed, they are disambiguated via this function
const kindFiltersEncoder = (base: Field, owner: Field): FiltersEncoder => {
  return (values: FilterValue[], matchAny: boolean, not: boolean, moreThan: boolean) => {
    const { baseValues, ownerValues } = _.groupBy(values, value => {
      return isOwnerKind(value.v) ? 'ownerValues' : 'baseValues';
    });
    const filters: string[] = [];
    if (baseValues && baseValues.length > 0) {
      filters.push(
        matcher(
          base,
          baseValues.map(value => value.v),
          not,
          moreThan || false
        )
      );
    }
    if (ownerValues && ownerValues.length > 0) {
      filters.push(
        matcher(
          owner,
          ownerValues.map(value => value.v),
          not,
          moreThan || false
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

const withDest = (src: FilterDefinition, dstEncoder: FiltersEncoder): FilterDefinition[] => {
  return [
    src,
    {
      ...src,
      id: src.id.replace('src_', 'dst_') as FilterId,
      category: FilterCategory.Destination,
      encoder: dstEncoder
    }
  ];
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
export const getFilterDefinitions = (
  t: TFunction,
  allowConnectionFilter?: boolean,
  allowDNSFilter?: boolean
): FilterDefinition[] => {
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
      ...withDest(
        {
          id: 'src_namespace',
          name: t('Namespace'),
          component: FilterComponent.Autocomplete,
          autoCompleteAddsQuotes: true,
          category: FilterCategory.Source,
          getOptions: cap10(getNamespaceOptions),
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples,
          encoder: simpleFiltersEncoder('SrcK8S_Namespace'),
          overlap: true
        },
        simpleFiltersEncoder('DstK8S_Namespace')
      ),
      ...withDest(
        {
          id: 'src_name',
          name: t('Name'),
          component: FilterComponent.Text,
          category: FilterCategory.Source,
          getOptions: noOption,
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples,
          encoder: simpleFiltersEncoder('SrcK8S_Name'),
          overlap: false
        },
        simpleFiltersEncoder('DstK8S_Name')
      ),
      ...withDest(
        {
          id: 'src_kind',
          name: t('Kind'),
          component: FilterComponent.Autocomplete,
          autoCompleteAddsQuotes: true,
          category: FilterCategory.Source,
          getOptions: cap10(getKindOptions),
          validate: rejectEmptyValue,
          encoder: kindFiltersEncoder('SrcK8S_Type', 'SrcK8S_OwnerType'),
          overlap: false
        },
        kindFiltersEncoder('DstK8S_Type', 'DstK8S_OwnerType')
      ),
      ...withDest(
        {
          id: 'src_owner_name',
          name: t('Owner Name'),
          component: FilterComponent.Text,
          category: FilterCategory.Source,
          getOptions: noOption,
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples,
          encoder: simpleFiltersEncoder('SrcK8S_OwnerName'),
          overlap: true
        },
        simpleFiltersEncoder('DstK8S_OwnerName')
      ),
      ...withDest(
        {
          id: 'src_resource',
          name: t('Resource'),
          component: FilterComponent.Autocomplete,
          category: FilterCategory.Source,
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
        ${t('You can also directly specify a kind, namespace and name like pod.openshift.apiserver')}`,
          encoder: k8sResourceFiltersEncoder(
            'SrcK8S_Type',
            'SrcK8S_OwnerType',
            'SrcK8S_Namespace',
            'SrcK8S_Name',
            'SrcK8S_OwnerName'
          ),
          overlap: false
        },
        k8sResourceFiltersEncoder(
          'DstK8S_Type',
          'DstK8S_OwnerType',
          'DstK8S_Namespace',
          'DstK8S_Name',
          'DstK8S_OwnerName'
        )
      ),
      ...withDest(
        {
          id: 'src_address',
          name: t('IP'),
          component: FilterComponent.Text,
          category: FilterCategory.Source,
          getOptions: noOption,
          validate: (value: string) => {
            if (_.isEmpty(value)) {
              return invalid(t('Value is empty'));
            }
            return validateIPFilter(value) ? valid(value) : invalid(invalidIPMessage);
          },
          hint: ipHint,
          examples: ipExamples,
          encoder: simpleFiltersEncoder('SrcAddr'),
          overlap: false
        },
        simpleFiltersEncoder('DstAddr')
      ),
      ...withDest(
        {
          id: 'src_port',
          name: t('Port'),
          component: FilterComponent.Autocomplete,
          category: FilterCategory.Source,
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
        - ${t('A IANA name like HTTP, FTP')}`,
          encoder: simpleFiltersEncoder('SrcPort'),
          overlap: false
        },
        simpleFiltersEncoder('DstPort')
      ),
      ...withDest(
        {
          id: 'src_mac',
          name: t('MAC'),
          component: FilterComponent.Text,
          category: FilterCategory.Source,
          getOptions: noOption,
          validate: (value: string) => {
            if (_.isEmpty(value)) {
              return invalid(t('Value is empty'));
            }
            return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/.test(value) ? valid(value) : invalid(invalidMACMessage);
          },
          hint: t('Specify a single MAC address.'),
          encoder: simpleFiltersEncoder('SrcMac'),
          overlap: false
        },
        simpleFiltersEncoder('DstMac')
      ),
      ...withDest(
        {
          id: 'src_host_address',
          name: t('Node IP'),
          component: FilterComponent.Text,
          category: FilterCategory.Source,
          getOptions: noOption,
          validate: (value: string) => {
            if (_.isEmpty(value)) {
              return invalid(t('Value is empty'));
            }
            return validateIPFilter(value) ? valid(value) : invalid(invalidIPMessage);
          },
          hint: ipHint,
          examples: ipExamples,
          encoder: simpleFiltersEncoder('SrcK8S_HostIP'),
          overlap: true
        },
        simpleFiltersEncoder('DstK8S_HostIP')
      ),
      ...withDest(
        {
          id: 'src_host_name',
          name: t('Node Name'),
          component: FilterComponent.Text,
          category: FilterCategory.Source,
          getOptions: noOption,
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples,
          encoder: simpleFiltersEncoder('SrcK8S_HostName'),
          overlap: true
        },
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
        encoder: simpleFiltersEncoder('Proto'),
        overlap: false
      },
      {
        id: 'interface',
        name: t('Network interface'),
        category: FilterCategory.None,
        component: FilterComponent.Text,
        getOptions: noOption,
        validate: rejectEmptyValue,
        hint: t('Specify a network interface.'),
        encoder: simpleFiltersEncoder('Interface'),
        overlap: false
      },
      {
        id: 'id',
        name: t('Conversation Id'),
        category: FilterCategory.None,
        component: FilterComponent.Text,
        getOptions: noOption,
        validate: rejectEmptyValue,
        hint: t('Specify a single conversation hash Id.'),
        encoder: simpleFiltersEncoder('_HashId'),
        overlap: false
      },
      {
        id: 'pkt_drop_state',
        name: t('Packet drop TCP state'),
        category: FilterCategory.None,
        component: FilterComponent.Autocomplete,
        getOptions: cap10(getDropStateOptions),
        validate: rejectEmptyValue,
        hint: t('Specify a single TCP state.'),
        examples: `${t('Specify a single TCP state name like:')}
        - ${t('A _LINUX_TCP_STATES_H number like 1, 2, 3')}
        - ${t('A _LINUX_TCP_STATES_H TCP name like ESTABLISHED, SYN_SENT, SYN_RECV')}`,
        docUrl: "https://github.com/torvalds/linux/blob/master/include/net/tcp_states.h",
        encoder: simpleFiltersEncoder('PktDropLatestState'),
        overlap: false
      },
      {
        id: 'pkt_drop_cause',
        name: t('Packet drop latest cause'),
        category: FilterCategory.None,
        component: FilterComponent.Autocomplete,
        getOptions: cap10(getDropCauseOptions),
        validate: rejectEmptyValue,
        hint: t('Specify a single packet drop cause.'),
        examples: `${t('Specify a single packet drop cause like:')}
        - ${t('A _LINUX_DROPREASON_CORE_H number like 2, 3, 4')}
        - ${t('A _LINUX_DROPREASON_CORE_H SKB_DROP_REASON name like NOT_SPECIFIED, NO_SOCKET, PKT_TOO_SMALL')}`,
        docUrl: "https://github.com/torvalds/linux/blob/master/include/net/dropreason-core.h",
        encoder: simpleFiltersEncoder('PktDropLatestDropCause'),
        overlap: false
      },
      {
        id: 'dns_id',
        name: t('DNS Id'),
        category: FilterCategory.None,
        component: FilterComponent.Number,
        getOptions: noOption,
        validate: rejectEmptyValue,
        hint: t('Specify a single DNS Id.'),
        encoder: simpleFiltersEncoder('DnsId'),
        overlap: false
      },
      {
        id: 'dns_latency',
        name: t('DNS Latency'),
        category: FilterCategory.None,
        component: FilterComponent.Number,
        getOptions: noOption,
        validate: rejectEmptyValue,
        hint: t('Specify a DNS Latency in miliseconds.'),
        encoder: simpleFiltersEncoder('DnsLatencyMs'),
        overlap: false
      },
      {
        id: 'dns_flag_response_code',
        name: t('DNS Response Code'),
        category: FilterCategory.None,
        component: FilterComponent.Autocomplete,
        getOptions: cap10(getDnsResponseCodeOptions),
        validate: rejectEmptyValue,
        hint: t('Specify a single DNS RCODE name.'),
        examples: `${t('Specify a single DNS RCODE name like:')}
        - ${t('A IANA RCODE number like 0, 3, 9')}
        - ${t('A IANA RCODE name like NoError, NXDomain, NotAuth')}`,
        encoder: simpleFiltersEncoder('DnsFlagsResponseCode'),
        overlap: false
      }
    ];
  }

  if (allowConnectionFilter && allowDNSFilter) {
    return filterDefinitions;
  } else {
    return filterDefinitions.filter(
      fd => (allowConnectionFilter || fd.id !== 'id') && (allowDNSFilter || !fd.id.startsWith('dns_'))
    );
  }
};

export const findFilter = (t: TFunction, id: FilterId) =>
  getFilterDefinitions(t, true, true).find(def => def.id === id);
