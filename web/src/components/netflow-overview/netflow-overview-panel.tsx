import { Card, Flex, FlexItem, Text, TextVariants } from '@patternfly/react-core';
import * as React from 'react';

import './netflow-overview-panel.css';

export const NetflowOverviewPanel: React.FC<{
  doubleWidth: boolean;
  bodyClassSmall: boolean;
  title: string;
  kebab?: JSX.Element;
}> = ({ doubleWidth, bodyClassSmall, title, kebab, children }) => {
  return (
    <FlexItem className={`overview-flex-item ${doubleWidth ? 'full' : ''}`}>
      <Card isFlat className="overview-card">
        <Flex className="overview-card-content" direction={{ default: 'column' }}>
          <FlexItem>
            <Flex direction={{ default: 'row' }}>
              <FlexItem flex={{ default: 'flex_1' }} className="overview-title">
                <Text component={TextVariants.h3}>{title}</Text>
              </FlexItem>
              <FlexItem>{kebab}</FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem
            flex={{ default: 'flex_1' }}
            className={bodyClassSmall ? 'overview-panel-body-small' : 'overview-panel-body'}
          >
            {children}
          </FlexItem>
        </Flex>
      </Card>
    </FlexItem>
  );
};
