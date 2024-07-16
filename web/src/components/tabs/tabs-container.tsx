import { Button, Flex, FlexItem, Tab, Tabs, TabTitleText, Tooltip } from '@patternfly/react-core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TimeRange } from '../../utils/datetime';
import { ViewId } from '../netflow-traffic';

export interface TabsContainerProps {
  isDarkTheme: boolean;
  selectedViewId: ViewId;
  selectView: (v: ViewId) => void;
  isAllowLoki: boolean;
  showHistogram: boolean;
  setShowViewOptions: (v: boolean) => void;
  setShowHistogram: (v: boolean) => void;
  setHistogramRange: (v: TimeRange | undefined) => void;
  isShowViewOptions: boolean;
}

export const TabsContainer: React.FC<TabsContainerProps> = props => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <Flex className="netflow-traffic-tabs-container">
      <FlexItem id="tabs-container" flex={{ default: 'flex_1' }}>
        <Tabs
          className={`netflow-traffic-tabs ${props.isDarkTheme ? 'dark' : 'light'}`}
          usePageInsets
          activeKey={props.selectedViewId}
          onSelect={(event, eventkey) => props.selectView(eventkey as ViewId)}
          role="region"
        >
          <Tab
            className="overviewTabButton"
            eventKey={'overview'}
            title={<TabTitleText>{t('Overview')}</TabTitleText>}
          />
          <Tab
            className="tableTabButton"
            eventKey={'table'}
            isAriaDisabled={!props.isAllowLoki} // required instead of 'disabled' when used with a tooltip
            tooltip={
              !props.isAllowLoki ? (
                <Tooltip content={t('Only available when FlowCollector.loki.enable is true')} />
              ) : undefined
            }
            title={<TabTitleText>{t('Traffic flows')}</TabTitleText>}
          />
          <Tab
            className="topologyTabButton"
            eventKey={'topology'}
            title={<TabTitleText>{t('Topology')}</TabTitleText>}
          />
          <Tab className="mapTabButton" eventKey={'map'} title={<TabTitleText>{t('External traffic')}</TabTitleText>} />
        </Tabs>
      </FlexItem>
      {props.selectedViewId === 'table' && (
        <FlexItem className={`${props.isDarkTheme ? 'dark' : 'light'}-bottom-border`}>
          <Button
            data-test="show-histogram-button"
            id="show-histogram-button"
            variant="link"
            className="overflow-button"
            onClick={() => {
              props.setShowViewOptions(false);
              props.setShowHistogram(!props.showHistogram);
              props.setHistogramRange(undefined);
            }}
          >
            {props.showHistogram ? t('Hide histogram') : t('Show histogram')}
          </Button>
        </FlexItem>
      )}
      <FlexItem className={`${props.isDarkTheme ? 'dark' : 'light'}-bottom-border`}>
        <Button
          data-test="show-view-options-button"
          id="show-view-options-button"
          variant="link"
          className="overflow-button"
          onClick={() => {
            props.setShowViewOptions(!props.isShowViewOptions);
            props.setShowHistogram(false);
            props.setHistogramRange(undefined);
          }}
        >
          {props.isShowViewOptions ? t('Hide advanced options') : t('Show advanced options')}
        </Button>
      </FlexItem>
    </Flex>
  );
};

export default TabsContainer;
