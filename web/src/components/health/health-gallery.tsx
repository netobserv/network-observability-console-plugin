import { Bullseye, Card, CardBody, CardHeader, CardTitle, EmptyState, EmptyStateIcon, Flex, Gallery, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';

import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { BellIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InfoAltIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ByResource, getRulesPreview } from './helper';

export interface HealthGalleryProps {
  title: string;
  stats: ByResource[];
  kind?: string;
  isDark: boolean;
}

// Idée: une heatmap qui prend en compte de combien dépasse chaque alerte
// Critical: gradient rouge => vert
// Warning: gradient orange => vert
// Info: gradient bleu => vert
// Pour chacun, pending et/ou silenced => gradient diminué
// Chaque case est cliquable pour ouvrir les détails
// Tooltip affiche le détail de l'alerte

export const HealthGallery: React.FC<HealthGalleryProps> = ({ title, stats, kind, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const sorted = _.orderBy(stats, [
    r => r.critical.firing.length,
    r => r.warning.firing.length,
    r => r.other.firing.length,
    r => r.critical.pending.length + r.warning.pending.length + r.other.pending.length,
    r => r.critical.silenced.length + r.warning.silenced.length + r.other.silenced.length,
  ], ['desc', 'desc', 'desc', 'desc', 'desc']);

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{title}</Text>
      </TextContent>
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
          const pendings = r.critical.pending.length + r.warning.pending.length + r.other.pending.length;
          const silenced = r.critical.silenced.length + r.warning.silenced.length + r.other.silenced.length;
          const classes = ['card'];
          let icon = <InfoAltIcon className='icon'/>;
          if (r.critical.firing.length > 0) {
            classes.push('critical');
            icon = <ExclamationCircleIcon className='icon critical'/>;
          } else if (r.warning.firing.length > 0) {
            classes.push('warning');
            icon = <ExclamationTriangleIcon className='icon warning'/>;
          } else if (r.other.firing.length > 0) {
            classes.push('minor');
            icon = <BellIcon className='icon minor'/>;
          }
          if (isDark) {
            classes.push('dark');
          }
          return (
            <Card key={'card-' + r.name} className={classes.join(' ')}>
              <CardHeader className='card-header'>
                <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
                  {icon}
                  <CardTitle>{kind ? <ResourceLink inline={true} kind={kind} name={r.name} /> : t('(global)')}</CardTitle>
                </Flex>
              </CardHeader>
              <CardBody>
                <ul style={{listStyleType: 'none'}}>
                  {r.critical.firing.length > 0 && (
                    <li>{r.critical.firing.length} {t('critical issues')}</li>
                  )}
                  {r.warning.firing.length > 0 && (
                    <li>{r.warning.firing.length} {t('warnings')}</li>
                  )}
                  {r.other.firing.length > 0 && (
                    <li>{r.other.firing.length} {t('minor issues')}</li>
                  )}
                  {pendings > 0 && (
                    <li>{pendings} {t('pending issues')}</li>
                  )}
                  {silenced > 0 && (
                    <li>{silenced} {t('silenced issues')}</li>
                  )}
                  <li>{getRulesPreview(r)}</li>
                </ul>
              </CardBody>
            </Card>
          );
        })}
      </Gallery>
    </>
  );
};
