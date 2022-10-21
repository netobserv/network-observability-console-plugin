import { Divider, FlexItem, Panel, PanelHeader, PanelMain, PanelMainBody } from '@patternfly/react-core';
import * as React from 'react';

import './netflow-overview-panel.css';

export const NetflowOverviewPanel: React.FC<{
  doubleWidth: boolean;
  bodyClassSmall: boolean;
  title: string;
  kebab?: JSX.Element;
}> = ({ doubleWidth, bodyClassSmall, title, kebab, children }) => {
  return (
    <FlexItem style={{ minWidth: doubleWidth ? '99%' : '48%' }} className="overview-flex-item">
      <Panel variant="raised">
        <PanelHeader>
          {title}
          {kebab}
        </PanelHeader>
        <Divider />
        <PanelMain>
          <PanelMainBody className={bodyClassSmall ? 'overview-panel-body-small' : 'overview-panel-body'}>
            {children}
          </PanelMainBody>
        </PanelMain>
      </Panel>
    </FlexItem>
  );
};
