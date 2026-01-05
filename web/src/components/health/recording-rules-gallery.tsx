import { Bullseye, EmptyState, EmptyStateIcon, Gallery, Title } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RecordingRuleCard } from './recording-rule-card';
import { RecordingRulesByResource } from './health-helper';

export interface RecordingRulesGalleryProps {
  stats: RecordingRulesByResource[];
  kind: string;
  isDark: boolean;
  selectedResource: RecordingRulesByResource | undefined;
  setSelectedResource: (r: RecordingRulesByResource | undefined) => void;
}

export const RecordingRulesGallery: React.FC<RecordingRulesGalleryProps> = ({
  stats,
  kind,
  isDark,
  selectedResource,
  setSelectedResource
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  // Sort by severity: most critical first
  const sorted = [...stats].sort((a, b) => {
    const aScore = a.critical.length * 3 + a.warning.length * 2 + a.other.length;
    const bScore = b.critical.length * 3 + b.warning.length * 2 + b.other.length;
    return bScore - aScore;
  });

  return (
    <>
      {sorted.length === 0 && (
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon icon={CheckCircleIcon} />
            <Title headingLevel="h2">{t('No recording rules found')}</Title>
          </EmptyState>
        </Bullseye>
      )}
      <Gallery hasGutter minWidths={{ default: '300px' }}>
        {sorted.map(r => {
          return (
            <RecordingRuleCard
              key={`recording-card-${r.name}`}
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
