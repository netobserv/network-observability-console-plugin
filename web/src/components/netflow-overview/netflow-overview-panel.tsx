import { Button, Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { CompressIcon, ExpandIcon, InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';

import { useTranslation } from 'react-i18next';
import './netflow-overview-panel.css';

export interface NetflowOverviewPanelProps {
  doubleWidth: boolean;
  bodyClassName: string;
  title: string;
  titleTooltip?: string;
  kebab?: JSX.Element;
  onClick?: () => void;
  focusOn?: (id?: string) => void;
  isSelected?: boolean;
  isFocus?: boolean;
  id?: string;
}

export const NetflowOverviewPanel: React.FC<NetflowOverviewPanelProps> = ({
  id,
  doubleWidth,
  bodyClassName,
  title,
  titleTooltip,
  kebab,
  children,
  onClick,
  focusOn,
  isSelected,
  isFocus
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <FlexItem id={id} className={`overview-flex-item center ${doubleWidth ? 'full' : ''}`}>
      <Card
        isFlat
        isFullHeight
        isSelectable={onClick !== undefined}
        className="overview-card"
        isSelectableRaised={isSelected}
        onClick={onClick}
      >
        <Flex className="overview-card-content" direction={{ default: 'column' }}>
          <FlexItem>
            <Flex direction={{ default: 'row' }}>
              <FlexItem flex={{ default: 'flex_1' }} className="overview-title">
                <Text component={TextVariants.h3}>
                  {title}
                  {titleTooltip && (
                    <Tooltip content={titleTooltip}>
                      <InfoAltIcon />
                    </Tooltip>
                  )}
                </Text>
              </FlexItem>
              {focusOn !== undefined && (
                <FlexItem className="overview-expand-button-container">
                  <Tooltip
                    content={
                      <Text component={TextVariants.p}>
                        {isFocus ? t('Show all graphs') : t('Focus on this graph')}
                      </Text>
                    }
                  >
                    <Button
                      variant="plain"
                      className="overview-expand-button"
                      icon={isFocus ? <CompressIcon /> : <ExpandIcon />}
                      onClick={() => focusOn(id)}
                    />
                  </Tooltip>
                </FlexItem>
              )}
              {onClick === undefined && <FlexItem>{kebab}</FlexItem>}
            </Flex>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }} className={bodyClassName}>
            {children}
          </FlexItem>
        </Flex>
      </Card>
    </FlexItem>
  );
};
