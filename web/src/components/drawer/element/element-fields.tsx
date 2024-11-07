import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, FilterDefinition } from '../../../model/filters';
import { getCustomScopes, getScopeName } from '../../../model/scope';
import { NodeData } from '../../../model/topology';
import { createPeer } from '../../../utils/metrics';
import { ElementField } from './element-field';

export interface ElementFieldsProps {
  id: string;
  data: NodeData;
  forceFirstAsText?: boolean;
  activeFilters: Filter[];
  setFilters: (filters: Filter[]) => void;
  filterDefinitions: FilterDefinition[];
}

export const ElementFields: React.FC<ElementFieldsProps> = ({
  id,
  data,
  forceFirstAsText,
  activeFilters,
  setFilters,
  filterDefinitions
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const fragments = [];
  let forceAsText = forceFirstAsText;
  let forceLabel = forceFirstAsText ? t('Name') : undefined;
  if (data.peer.resource) {
    fragments.push(
      <ElementField
        id={id + '-resource'}
        key={id + '-resource'}
        label={forceLabel || data.peer.resource.type}
        forcedText={forceAsText ? data.peer.resource.name : undefined}
        activeFilters={activeFilters}
        filterType={'resource'}
        peer={data.peer}
        setFilters={setFilters}
        filterDefinitions={filterDefinitions}
      />
    );
    forceLabel = forceAsText = undefined;
  }
  if (data.peer.owner && data.peer.owner.type !== data.peer.resource?.type) {
    fragments.push(
      <ElementField
        id={id + '-owner'}
        key={id + '-owner'}
        label={forceLabel || data.peer.owner.type}
        forcedText={forceAsText ? data.peer.owner.name : undefined}
        activeFilters={activeFilters}
        filterType={'owner'}
        peer={createPeer({ owner: data.peer.owner, namespace: data.peer.namespace })}
        setFilters={setFilters}
        filterDefinitions={filterDefinitions}
      />
    );
    forceLabel = forceAsText = undefined;
  }
  // add available fields from custom scopes
  getCustomScopes().forEach(sc => {
    const value = data.peer[sc.id] as string | undefined;
    if (value) {
      fragments.push(
        <ElementField
          id={`${id}-${sc}`}
          key={`${id}-${sc}`}
          label={forceLabel || getScopeName(sc, t)}
          forcedText={forceAsText ? value : undefined}
          activeFilters={activeFilters}
          filterType={sc.id}
          peer={createPeer({ [sc.id]: value })}
          setFilters={setFilters}
          filterDefinitions={filterDefinitions}
        />
      );
      forceLabel = forceAsText = undefined;
    }
  });
  if (data.peer.addr) {
    fragments.push(
      <ElementField
        id={id + '-address'}
        key={id + '-address'}
        label={t('IP')}
        activeFilters={activeFilters}
        filterType={'resource'}
        peer={createPeer({ addr: data.peer.addr })}
        setFilters={setFilters}
        filterDefinitions={filterDefinitions}
      />
    );
  }

  return (
    <>
      {fragments.length > 0 ? (
        fragments
      ) : (
        <TextContent id={id + '-no-infos'} className="record-field-container">
          {
            <Text component={TextVariants.p}>
              {t('No information available for this content. Change scope to get more details.')}
            </Text>
          }
        </TextContent>
      )}
    </>
  );
};
