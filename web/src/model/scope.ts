import { ContextSingleton } from '../utils/context';
import { Feature } from './config';
import { FlowScope } from './flow-query';
import { TopologyGroupTypes } from './topology';

export type ScopeConfigDef = {
  id: FlowScope;
  name: string;
  description: string;
  labels: string[];
  feature?: Feature;
  groups?: string[];
  filter?: string;
  filters?: string[];
  stepInto?: FlowScope;
};

export const getScopeName = (sc: ScopeConfigDef | undefined, t: (k: string) => string) => {
  if (!sc) {
    return t('n/a');
  }
  return sc.name || sc.id;
};

export const getGroupsForScope = (scopeId: FlowScope, scopes: ScopeConfigDef[]): TopologyGroupTypes[] => {
  const scope = scopes.find(sc => sc.id === scopeId);
  if (scope?.groups?.length) {
    const availableParts = scopes.map(sc => `${sc.id}s`);
    return ['none', 'auto', ...scope.groups.filter(gp => gp.split('+').every(part => availableParts.includes(part)))];
  }
  return ['none', 'auto'];
};

export const resolveGroupTypes = (
  inGroupTypes: TopologyGroupTypes,
  scopeId: FlowScope,
  scopes: ScopeConfigDef[]
): TopologyGroupTypes => {
  if (inGroupTypes === 'auto') {
    const groups = getGroupsForScope(scopeId, scopes);
    if (groups.includes('namespaces')) {
      return 'namespaces';
    }
    // More logic can be added here for more default behaviours
    return 'none';
  }
  return inGroupTypes;
};

export const getGroupName = (group: TopologyGroupTypes, scopes: ScopeConfigDef[], t: (k: string) => string) => {
  if (group === 'none') {
    return t('None');
  } else if (group === 'auto') {
    return t('Auto');
  } else if (group.includes('+')) {
    return group
      .split('+')
      .map(id => scopes.find(sc => `${sc.id}s` === id)?.name || `invalid ${id}`)
      .join(' + ');
  } else {
    const found = scopes.find(sc => `${sc.id}s` === group);
    if (found) {
      return found.name;
    } else {
      return `invalid ${group}`;
    }
  }
};

export const getCustomScopes = () => {
  return ContextSingleton.getScopes().filter(sc => !['owner', 'resource', 'addr'].includes(sc.id));
};

export const getCustomScopeIds = () => {
  return getCustomScopes().map(sc => sc.id);
};

export const isDirectionnal = (sc: ScopeConfigDef) => {
  return sc.filters && !sc.filter;
};

export const getNonDirectionnalScopes = () => {
  return ContextSingleton.getScopes().filter(sc => !isDirectionnal(sc));
};

export const getDirectionnalScopes = () => {
  return ContextSingleton.getScopes().filter(sc => isDirectionnal(sc));
};

export const getStepInto = (scopeId: FlowScope, allowedIds: FlowScope[]): FlowScope | undefined => {
  const next = ContextSingleton.getScopes().find(sc => sc.id === scopeId)?.stepInto;
  if (!next || allowedIds.includes(next)) {
    return next;
  }
  // recursively get next scope as some may be hidden due to selected features
  return getStepInto(next, allowedIds);
};
