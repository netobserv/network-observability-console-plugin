import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { Field } from '../api/ipfix';
import {
  FilterCategory,
  FilterComponent,
  FilterConfigDef,
  FilterDefinition,
  FilterId,
  FilterOption,
  FiltersEncoder,
  FilterValue
} from '../model/filters';
import { joinResource, SplitResource, splitResource, SplitStage } from '../model/resource';
import { getPort } from '../utils/port';
import { ColumnConfigDef } from './columns';
import {
  findDirectionOption,
  findProtocolOption,
  getClusterOptions,
  getDirectionOptionsAsync,
  getDnsErrorCodeOptions,
  getDnsResponseCodeOptions,
  getDropCauseOptions,
  getDropStateOptions,
  getDSCPOptions,
  getKindOptions,
  getNamespaceOptions,
  getPortOptions,
  getProtocolOptions,
  getResourceOptions,
  getZoneOptions,
  noOption
} from './filter-options';
import { validateIPFilter } from './ip';
import { validateK8SName, validateStrictK8SName } from './label';

// Convenience string to filter by undefined field values
export const undefinedValue = '""';

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

export const getFilterDefinitions = (
  filterDefs: FilterConfigDef[],
  columnsDefs: ColumnConfigDef[],
  t: TFunction
): FilterDefinition[] => {
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

  const k8sResourceValidation = (value: string) => {
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
  };

  const k8sResourceCompletion = (value: string, selected: string) => {
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
  };

  const addressValidation = (value: string) => {
    if (_.isEmpty(value)) {
      return invalid(t('Value is empty'));
    }
    return validateIPFilter(value)
      ? valid(value)
      : invalid(t('Not a valid IPv4 or IPv6, nor a CIDR, nor an IP range separated by hyphen'));
  };

  const portValidation = (value: string) => {
    if (_.isEmpty(value)) {
      return invalid(t('Value is empty'));
    }
    //allow any port number or valid name / value
    if (value == undefinedValue || !isNaN(Number(value)) || getPort(value)) {
      return valid(value);
    }
    return invalid(t('Unknown port'));
  };

  const macValidation = (value: string) => {
    if (_.isEmpty(value)) {
      return invalid(t('Value is empty'));
    }
    return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/.test(value)
      ? valid(value)
      : invalid(t('Not a valid MAC address'));
  };

  const protoValidation = (value: string) => {
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
  };

  const dirValidation = (value: string) => {
    if (_.isEmpty(value)) {
      return invalid(t('Value is empty'));
    }
    //allow 0 / 1 or Ingress / Egress
    const found = findDirectionOption(value, t);
    if (found) {
      return valid(found.name);
    }
    return invalid(t('Unknown direction'));
  };

  const getFuncs = (d: FilterConfigDef) => {
    const isSrc = d.id.includes('src');
    const colConfig = columnsDefs.find(c => c.filter === d.id);

    let getOptions: (value: string) => Promise<FilterOption[]> = noOption;
    let validate: (value: string) => { val?: string; err?: string } = rejectEmptyValue;
    let encoder: FiltersEncoder = simpleFiltersEncoder(colConfig?.field as Field);
    let checkCompletion:
      | ((value: string, selected: string) => { completed: boolean; option: FilterOption })
      | undefined = undefined;

    if (d.id.includes('namespace')) {
      getOptions = getNamespaceOptions;
      validate = k8sNameValidation;
    } else if (d.id.includes('cluster')) {
      getOptions = getClusterOptions;
    } else if (d.id.includes('zone')) {
      getOptions = getZoneOptions;
    } else if (d.id.includes('name')) {
      validate = k8sNameValidation;
    } else if (d.id.includes('kind')) {
      getOptions = getKindOptions;
      encoder = kindFiltersEncoder(`${isSrc ? 'Src' : 'Dst'}K8S_Type`, `${isSrc ? 'Src' : 'Dst'}K8S_OwnerType`);
    } else if (d.id.includes('resource')) {
      getOptions = getResourceOptions;
      validate = k8sResourceValidation;
      checkCompletion = k8sResourceCompletion;
      encoder = k8sResourceFiltersEncoder(
        `${isSrc ? 'Src' : 'Dst'}K8S_Type`,
        `${isSrc ? 'Src' : 'Dst'}K8S_OwnerType`,
        `${isSrc ? 'Src' : 'Dst'}K8S_Namespace`,
        `${isSrc ? 'Src' : 'Dst'}K8S_Name`,
        `${isSrc ? 'Src' : 'Dst'}K8S_OwnerName`
      );
    } else if (d.id.includes('address')) {
      validate = addressValidation;
    } else if (d.id.includes('port')) {
      getOptions = getPortOptions;
      validate = portValidation;
    } else if (d.id.includes('mac')) {
      validate = macValidation;
    } else if (d.id.includes('proto')) {
      getOptions = getProtocolOptions;
      validate = protoValidation;
    } else if (d.id.includes('direction')) {
      getOptions = v => getDirectionOptionsAsync(v, t, d.id === 'nodedirection');
      validate = dirValidation;
    } else if (d.id.includes('drop_state')) {
      getOptions = getDropStateOptions;
      encoder = simpleFiltersEncoder('PktDropLatestState');
    } else if (d.id.includes('drop_cause')) {
      getOptions = getDropCauseOptions;
      encoder = simpleFiltersEncoder('PktDropLatestDropCause');
    } else if (d.id.includes('dns_flag_response_code')) {
      getOptions = getDnsResponseCodeOptions;
    } else if (d.id.includes('dns_errno')) {
      getOptions = getDnsErrorCodeOptions;
    } else if (d.id.includes('dscp')) {
      getOptions = getDSCPOptions;
    }
    return { getOptions, validate, encoder, checkCompletion };
  };

  return filterDefs.map(d => {
    return {
      id: d.id as FilterId,
      name: d.name,
      component: d.component as FilterComponent,
      category: !_.isEmpty(d.category) ? (d.category as FilterCategory) : undefined,
      autoCompleteAddsQuotes: d.autoCompleteAddsQuotes === true,
      hint: !_.isEmpty(d.hint) ? d.hint : undefined,
      examples: !_.isEmpty(d.examples) ? d.examples : undefined,
      docUrl: !_.isEmpty(d.docUrl) ? d.docUrl : undefined,
      placeholder: !_.isEmpty(d.placeholder) ? d.placeholder : undefined,
      ...getFuncs(d)
    };
  });
};

export const findFilter = (filterDefinitions: FilterDefinition[], id: FilterId) => {
  return filterDefinitions.find(def => def.id === id);
};

export const checkFilterAvailable = (fd: FilterDefinition, labels: string[]) => {
  const q = fd.encoder([{ v: 'any' }], false, false, false);
  const parts = q.split('&');
  for (let i = 0; i < parts.length; i++) {
    const kv = parts[i].split('=');
    if (kv.length === 0 || !labels.includes(kv[0])) {
      return false;
    }
  }
  return true;
};
