import * as _ from 'lodash';
import protocols from 'protocol-numbers';
import { getNamespaces, getResources } from '../api/routes';
import { FilterOption } from '../model/filters';
import { splitResource, SplitStage } from '../model/resource';
import { autoCompleteCache } from './autocomplete-cache';
import { DNS_RCODES } from './dns';
import { getPort, getService } from './port';
import { DROP_CAUSES, DROP_STATES } from './tcp-drop';

export const noOption: (value: string) => Promise<FilterOption[]> = () => Promise.resolve([]);

const toFilterOption = (name: string): FilterOption => {
  return { name, value: name };
};

const protocolOptions: FilterOption[] = Object.values(protocols)
  .map(proto => ({ name: proto.name, value: proto.value }))
  .filter(proto => !_.isEmpty(proto.name));
_.orderBy(protocolOptions, 'name');

export const getProtocolOptions = (value: string): Promise<FilterOption[]> => {
  const opts = protocolOptions.filter(
    opt => opt.value.startsWith(value) || opt.name.toLowerCase().startsWith(value.toLowerCase())
  );
  return Promise.resolve(opts);
};

const matchOptions = (opts: FilterOption[], match: string): FilterOption[] => {
  if (match) {
    return opts.filter(n => n.name.toLowerCase().startsWith(match.toLowerCase()));
  } else {
    return opts;
  }
};

export const getNamespaceOptions = (value: string): Promise<FilterOption[]> => {
  const namespaces = autoCompleteCache.getNamespaces();
  if (namespaces) {
    return Promise.resolve(matchOptions(namespaces.map(toFilterOption), value));
  }
  return getNamespaces().then(ns => {
    autoCompleteCache.setNamespaces(ns);
    return matchOptions(ns.map(toFilterOption), value);
  });
};

export const getNameOptions = (kind: string, namespace: string, name: string): Promise<FilterOption[]> => {
  if (autoCompleteCache.hasNames(kind, namespace)) {
    const options = (autoCompleteCache.getNames(kind, namespace) || []).map(toFilterOption);
    return Promise.resolve(matchOptions(options, name));
  }
  return getResources(namespace, kind).then(values => {
    autoCompleteCache.setNames(kind, namespace, values);
    return matchOptions(values.map(toFilterOption), name);
  });
};

export const getKindOptions = (value: string): Promise<FilterOption[]> => {
  const options = autoCompleteCache.getKinds().map(toFilterOption);
  return Promise.resolve(matchOptions(options, value));
};

export const getResourceOptions = (value: string): Promise<FilterOption[]> => {
  const parts = splitResource(value);
  switch (parts.stage) {
    case SplitStage.PartialKind:
      return getKindOptions(parts.kind);
    case SplitStage.PartialNamespace:
      return getNamespaceOptions(parts.namespace);
    case SplitStage.Completed:
      return getNameOptions(parts.kind, parts.namespace, parts.name);
  }
};

export const getPortOptions = (value: string): Promise<FilterOption[]> => {
  const isNumber = !isNaN(Number(value));
  const foundService = isNumber ? getService(Number(value)) : null;
  const foundPort = !isNumber ? getPort(value) : null;
  if (foundService) {
    return Promise.resolve([{ name: foundService, value: value }]);
  } else if (foundPort) {
    return Promise.resolve([{ name: value, value: foundPort }]);
  }
  return Promise.resolve([]);
};

export const getDropStateOptions = (value: string): Promise<FilterOption[]> => {
  return Promise.resolve(
    DROP_STATES.filter(
      opt => String(opt.value).includes(value) || opt.name.toLowerCase().includes(value.toLowerCase())
    ).map(v => ({ name: v.name.replace('TCP_', ''), value: v.name })) // map only names here since codes are stringified in storage
  );
};

export const getDropCauseOptions = (value: string): Promise<FilterOption[]> => {
  return Promise.resolve(
    DROP_CAUSES.filter(
      opt => String(opt.value).includes(value) || opt.name.toLowerCase().includes(value.toLowerCase())
    ).map(v => ({ name: v.name.replace('SKB_DROP_REASON_', ''), value: v.name })) // map only names here since codes are stringified in storage
  );
};

export const getDnsResponseCodeOptions = (value: string): Promise<FilterOption[]> => {
  return Promise.resolve(
    DNS_RCODES.filter(
      opt => String(opt.value).includes(value) || opt.name.toLowerCase().includes(value.toLowerCase())
    ).map(v => ({ name: v.name, value: v.name })) // map only names here since codes are stringified in storage
  );
};

export const findProtocolOption = (nameOrVal: string) => {
  return protocolOptions.find(p => p.name.toLowerCase() === nameOrVal.toLowerCase() || p.value === nameOrVal);
};

export const cap10 = (getOptions: (value: string) => Promise<FilterOption[]>) => {
  return (value: string) => {
    return getOptions(value).then(opts => {
      return opts.length <= 10 ? opts : opts.slice(0, 10);
    });
  };
};
