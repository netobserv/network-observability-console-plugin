import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Bullseye,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  EmptyStateIcon,
  Flex,
  FlexItem,
  Gallery,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoAltIcon
} from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { valueFormat } from '../../utils/format';
import { ByResource } from './helper';

export interface HealthGalleryProps {
  stats: ByResource[];
  kind?: string;
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
          const pending = [...r.critical.pending, ...r.warning.pending, ...r.other.pending];
          const silenced = [...r.critical.silenced, ...r.warning.silenced, ...r.other.silenced];
          const classes = ['card'];
          let icon = <InfoAltIcon className="icon" />;
          if (r.critical.firing.length > 0) {
            classes.push('critical');
            icon = <ExclamationCircleIcon className="icon critical" />;
          } else if (r.warning.firing.length > 0) {
            classes.push('warning');
            icon = <ExclamationTriangleIcon className="icon warning" />;
          } else if (r.other.firing.length > 0) {
            classes.push('minor');
            icon = <BellIcon className="icon minor" />;
          }
          if (isDark) {
            classes.push('dark');
          }
          return (
            <Card
              key={'card-' + r.name}
              className={classes.join(' ')}
              isClickable
              isClicked={r.name === selectedResource?.name}
            >
              <CardHeader
                className="card-header"
                selectableActions={{
                  selectableActionId: r.name,
                  selectableActionAriaLabelledby: 'selectable-card-' + r.name,
                  // name: 'single-selectable-card-example',
                  variant: 'single',
                  onClickAction: () => {
                    setSelectedResource(r.name !== selectedResource?.name ? r : undefined);
                  }
                }}
              >
                <Flex
                  gap={{ default: 'gapSm' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                  flexWrap={{ default: 'nowrap' }}
                >
                  <FlexItem>{icon}</FlexItem>
                  <FlexItem>
                    <CardTitle>
                      {kind ? <ResourceLink inline={true} kind={kind} name={r.name} /> : t('(global)')}
                    </CardTitle>
                  </FlexItem>
                </Flex>
              </CardHeader>
              <CardBody>
                <Flex
                  gap={{ default: 'gapSm' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                  flexWrap={{ default: 'nowrap' }}
                >
                  <FlexItem grow={{ default: 'grow' }}>
                    <ul style={{ listStyleType: 'none' }}>
                      {r.critical.firing.length > 0 && (
                        <li>
                          {r.critical.firing.length} {t('critical issues')}
                        </li>
                      )}
                      {r.warning.firing.length > 0 && (
                        <li>
                          {r.warning.firing.length} {t('warnings')}
                        </li>
                      )}
                      {r.other.firing.length > 0 && (
                        <li>
                          {r.other.firing.length} {t('minor issues')}
                        </li>
                      )}
                      {pending.length > 0 && (
                        <li>
                          {pending.length} {t('pending issues')}
                        </li>
                      )}
                      {silenced.length > 0 && (
                        <li>
                          {silenced.length} {t('silenced issues')}
                        </li>
                      )}
                    </ul>
                  </FlexItem>
                  <FlexItem>
                    <TextContent>
                      <Text component={TextVariants.h1}>{valueFormat(r.score)}</Text>
                    </TextContent>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          );
        })}
      </Gallery>
    </>
  );
};
