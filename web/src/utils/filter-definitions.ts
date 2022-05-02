import * as _ from 'lodash';
import { TFunction } from 'i18next';
import { getPort } from '../utils/port';
import { validateK8SName, validateStrictK8SName } from './label';
import { joinResource, splitResource, SplitStage } from '../model/resource';
import { validateIPFilter } from './ip';
import { Fields, Labels } from '../api/ipfix';
import {
  FilterId,
  FieldMapping,
  FilterValue,
  FilterDefinition,
  FilterCategory,
  FilterComponent
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

type Field = keyof Fields | keyof Labels;

const singleFieldMapping = (field: Field) => {
  const fm: FieldMapping = (values: FilterValue[]) => {
    return [
      {
        key: field,
        values: values.map(value => value.v)
      }
    ];
  };
  return fm;
};

// As owner / non-owner kind filters are mixed, they are disambiguated via this function
const kindFieldMapping = (base: Field, owner: Field) => {
  const fm: FieldMapping = (values: FilterValue[]) => {
    return [
      { key: base, values: values.map(value => value.v).filter(k => !isOwnerKind(k)) },
      { key: owner, values: values.map(value => value.v).filter(isOwnerKind) }
    ].filter(f => f.values.length > 0);
  };
  return fm;
};

const k8sResourceMapping = (kind: Field, ownerKind: Field, namespace: Field, name: Field, ownerName: Field) => {
  const fm: FieldMapping = (values: FilterValue[]) => {
    const splitValues = values.map(value => splitResource(value.v));
    return [
      { key: kind, values: splitValues.filter(r => !isOwnerKind(r.kind)).map(r => `"${r.kind}"`) },
      { key: ownerKind, values: splitValues.filter(r => isOwnerKind(r.kind)).map(r => `"${r.kind}"`) },
      { key: namespace, values: splitValues.map(r => `"${r.namespace}"`) },
      { key: name, values: splitValues.filter(r => !isOwnerKind(r.kind)).map(r => `"${r.name}"`) },
      { key: ownerName, values: splitValues.filter(r => isOwnerKind(r.kind)).map(r => `"${r.name}"`) }
    ].filter(f => f.values.length > 0);
  };
  return fm;
};

const peers = (base: FilterDefinition, srcFields: FieldMapping, dstFields: FieldMapping): FilterDefinition[] => {
  return [
    {
      ...base,
      id: ('src_' + base.id) as FilterId,
      category: FilterCategory.Source,
      fieldMatching: { always: srcFields }
    },
    {
      ...base,
      id: ('dst_' + base.id) as FilterId,
      category: FilterCategory.Destination,
      fieldMatching: { always: dstFields }
    },
    {
      ...base,
      category: FilterCategory.Common,
      fieldMatching: { ifSrc: srcFields, ifDst: dstFields }
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
export const getFilterDefinitions = (t: TFunction): FilterDefinition[] => {
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
    - ${t('A CIDR specification like 192.51.100.0/24, 2001:db8::/32')}`;

    const invalidIPMessage = t('Not a valid IPv4 or IPv6, nor a CIDR, nor an IP range separated by hyphen');

    filterDefinitions = [
      ...peers(
        {
          id: 'namespace',
          name: t('Namespace'),
          component: FilterComponent.Autocomplete,
          autoCompleteAddsQuotes: true,
          category: FilterCategory.Common,
          getOptions: cap10(getNamespaceOptions),
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples,
          fieldMatching: {}
        },
        singleFieldMapping('SrcK8S_Namespace'),
        singleFieldMapping('DstK8S_Namespace')
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
          examples: k8sNameExamples,
          fieldMatching: {}
        },
        singleFieldMapping('SrcK8S_Name'),
        singleFieldMapping('DstK8S_Name')
      ),
      ...peers(
        {
          id: 'kind',
          name: t('Kind'),
          component: FilterComponent.Autocomplete,
          autoCompleteAddsQuotes: true,
          category: FilterCategory.Common,
          getOptions: cap10(getKindOptions),
          validate: rejectEmptyValue,
          fieldMatching: {}
        },
        kindFieldMapping('SrcK8S_Type', 'SrcK8S_OwnerType'),
        kindFieldMapping('DstK8S_Type', 'DstK8S_OwnerType')
      ),
      ...peers(
        {
          id: 'owner_name',
          name: t('Owner Name'),
          component: FilterComponent.Text,
          category: FilterCategory.Common,
          getOptions: noOption,
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples,
          fieldMatching: {}
        },
        singleFieldMapping('SrcK8S_OwnerName'),
        singleFieldMapping('DstK8S_OwnerName')
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
        ${t('You can also directly specify a kind, namespace and name like pod.openshift.apiserver')}`,
          fieldMatching: {}
        },
        k8sResourceMapping('SrcK8S_Type', 'SrcK8S_OwnerType', 'SrcK8S_Namespace', 'SrcK8S_Name', 'SrcK8S_OwnerName'),
        k8sResourceMapping('DstK8S_Type', 'DstK8S_OwnerType', 'DstK8S_Namespace', 'DstK8S_Name', 'DstK8S_OwnerName')
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
          examples: ipExamples,
          fieldMatching: {}
        },
        singleFieldMapping('SrcAddr'),
        singleFieldMapping('DstAddr')
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
            if (!isNaN(Number(value)) || getPort(value)) {
              return valid(value);
            }
            return invalid(t('Unknown port'));
          },
          hint: t('Specify a single port number or name.'),
          examples: `${t('Specify a single port following one of these rules:')}
        - ${t('A port number like 80, 21')}
        - ${t('A IANA name like HTTP, FTP')}`,
          fieldMatching: {}
        },
        singleFieldMapping('SrcPort'),
        singleFieldMapping('DstPort')
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
          examples: ipExamples,
          fieldMatching: {}
        },
        singleFieldMapping('SrcK8S_HostIP'),
        singleFieldMapping('DstK8S_HostIP')
      ),
      ...peers(
        {
          id: 'host_name',
          name: t('Node Name'),
          component: FilterComponent.Text,
          category: FilterCategory.Common,
          getOptions: noOption,
          validate: k8sNameValidation,
          hint: k8sNameHint,
          examples: k8sNameExamples,
          fieldMatching: {}
        },
        singleFieldMapping('SrcK8S_HostName'),
        singleFieldMapping('DstK8S_HostName')
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
          if (!isNaN(Number(value))) {
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
        - ${t('A IANA name like TCP, UDP')}`,
        fieldMatching: { always: singleFieldMapping('Proto') }
      }
    ];
  }
  return filterDefinitions;
};
/* eslint-enable max-len */

export const findFilter = (t: TFunction, id: FilterId) => getFilterDefinitions(t).find(def => def.id === id);
