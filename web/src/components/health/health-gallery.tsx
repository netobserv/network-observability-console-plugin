import { Bullseye, EmptyState, EmptyStateIcon, Gallery, Title } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HealthCard } from './health-card';
import { ByResource } from './health-helper';

export interface HealthGalleryProps {
  stats: ByResource[];
  kind: string;
  isDark: boolean;
  selectedResource: ByResource | undefined;
  setSelectedResource: (r: ByResource | undefined) => void;
}

export const HealthGallery: React.FC<HealthGalleryProps> = ({
  stats,
  kind,
  isDark,
  selectedResource,
  setSelectedResource
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const sorted = _.orderBy(stats, r => r.score, 'asc');

  return (
    <>
      {sorted.length === 0 && (
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon icon={CheckCircleIcon} />
            <Title headingLevel="h2">{t('No violations found')}</Title>
          </EmptyState>
        </Bullseye>
      )}
      <Gallery hasGutter minWidths={{ default: '300px' }}>
        {sorted.map(r => {
          return (
            <HealthCard
              key={`card-${r.name}`}
              kind={kind}
              isDark={isDark}
              stats={r}
              isSelected={r.name === selectedResource?.name}
              onClick={() => {
                setSelectedResource(r.name !== selectedResource?.name ? r : undefined);
              }}
            />
          );
        })}
      </Gallery>
    </>
  );
};
