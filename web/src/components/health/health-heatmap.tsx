import { Flex, FlexItem, Grid, GridItem, Text, TextContent, TextVariants, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { valueFormat } from '../../utils/format';
import { AlertDetails, AlertDetailsValue } from './alert-details';
import { AlertWithRuleName, ByResource, computeAlertScore, getAllAlerts } from './helper';

import './heatmap.css';

export interface HealthHeatmapProps {
  info: ByResource;
  interactive: boolean;
}

// rgb in [0,255] bounds
export type Color = { r: number; g: number; b: number };
export type ColorMap = Color[];

const inactiveColorMap: ColorMap = [{ r: 62, g: 134, b: 53 }];

const criticalColorMap: ColorMap = [
  { r: 250, g: 234, b: 232 },
  { r: 163, g: 0, b: 0 },
  { r: 44, g: 0, b: 0 },
  { r: 20, g: 0, b: 20 }
];

const warningColorMap: ColorMap = [
  { r: 253, g: 247, b: 231 },
  { r: 240, g: 171, b: 0 },
  { r: 236, g: 122, b: 8 },
  { r: 59, g: 31, b: 0 }
];

const infoColorMap: ColorMap = [
  { r: 62, g: 134, b: 53 },
  { r: 228, g: 245, b: 188 },
  { r: 154, g: 216, b: 216 }
];

const getCellColors = (value: number, rangeFrom: number, rangeTo: number, colorMap: ColorMap) => {
  const clamped = Math.max(rangeFrom, Math.min(rangeTo, value));
  const ratio = (clamped - rangeFrom) / (rangeTo - rangeFrom); // e.g. 0.8 | 0 | 1
  const colorRatio = ratio * (colorMap.length - 1); // e.g. (length is 3) 1.6 | 0 | 2
  const colorLow = colorMap[Math.floor(colorRatio)]; // e.g. m[1] | m[0] | m[2]
  const colorHigh = colorMap[Math.ceil(colorRatio)]; // e.g. m[2] | m[0] | m[2]
  const remains = colorRatio - Math.floor(colorRatio); // e.g. 0.6 | 0 | 0
  const r = Math.floor((colorHigh.r - colorLow.r) * remains + colorLow.r);
  const g = Math.floor((colorHigh.g - colorLow.g) * remains + colorLow.g);
  const b = Math.floor((colorHigh.b - colorLow.b) * remains + colorLow.b);
  const brightness = 0.21 * r + 0.72 * g + 0.07 * b; // https://www.johndcook.com/blog/2009/08/24/algorithms-convert-color-grayscale/
  const textColor = brightness > 128 ? 'var(--pf-global--palette--black-1000)' : 'var(--pf-global--palette--black-100)';
  return {
    color: textColor,
    backgroundColor: `rgb(${r},${g},${b})`
  };
};

const buildGradientCSS = (colorMap: ColorMap): string => {
  const colorStops = colorMap.map(c => `rgb(${c.r},${c.g},${c.b})`);
  return 'linear-gradient(to right,' + colorStops.join(',') + ')';
};

export const HealthHeatmap: React.FC<HealthHeatmapProps> = ({ info, interactive }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [selectedItem, setSelectedItem] = React.useState<AlertWithRuleName | string | undefined>(undefined);

  const allAlerts = getAllAlerts(info);
  const inactive = [...info.critical.inactive, ...info.warning.inactive, ...info.other.inactive];

  React.useEffect(() => {
    // Retrieve selection when props.info changes
    if (selectedItem !== undefined) {
      const selectedAlert = typeof selectedItem === 'string' ? undefined : selectedItem;
      if (selectedAlert) {
        // Check active
        const retrieved = allAlerts.find(
          a => a.ruleName === selectedAlert.ruleName && _.isEqual(a.labels, selectedAlert.labels)
        );
        if (retrieved) {
          setSelectedItem(retrieved);
          return;
        }
        // Check inactive
        if (inactive.find(name => name === selectedAlert.ruleName)) {
          setSelectedItem(selectedAlert.ruleName);
          return;
        }
      } else {
        // Was inactive; check if there's now any active alert for that rule (pick first)
        const active = allAlerts.find(a => a.ruleName === selectedItem);
        if (active) {
          setSelectedItem(active);
          return;
        } else if (inactive.find(name => name === selectedItem)) {
          // No change in that case, just return
          return;
        }
      }
    }
    setSelectedItem(undefined);
    // Ignore allAlerts and inactive as they are derived from info
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, selectedItem, setSelectedItem]);

  const tooltip = (a: AlertWithRuleName): string => {
    let prefix = '';
    switch (a.state) {
      case 'pending':
        prefix = `[pending] `;
        break;
      case 'silenced':
        prefix = `[silenced] `;
        break;
    }
    const valueInfo =
      valueFormat(a.value as number, 2) +
      (a.metadata?.threshold ? '> ' + a.metadata.threshold + ' ' + a.metadata.unit : '');
    return `${prefix}${a.annotations['summary']} | ${valueInfo}`;
  };

  type CellInfo = { score: number; colorMap: ColorMap; tooltip: string; onClick?: () => void; selected: boolean };

  // Map active alerts to CellInfo, then concat inactive
  const items: CellInfo[] = allAlerts
    .map(a => {
      const colorMap =
        a.labels.severity === 'critical'
          ? criticalColorMap
          : a.labels.severity === 'warning'
          ? warningColorMap
          : infoColorMap;
      const score = computeAlertScore(a, true);
      return {
        score,
        colorMap: colorMap,
        tooltip: tooltip(a),
        onClick: interactive ? () => setSelectedItem(a) : undefined,
        selected: selectedItem === a
      };
    })
    .concat(
      // Map inactive rules to CellInfo
      inactive.map(ruleName => ({
        score: 0,
        colorMap: inactiveColorMap,
        tooltip: t('Rule {{ruleName}}: no alert', { ruleName }),
        onClick: interactive ? () => setSelectedItem(ruleName) : undefined,
        selected: selectedItem === ruleName
      }))
    )
    .slice(0, 24);

  // Fill remaining cells for a 5x5 array
  let remains = [];
  if (items.length < 25) {
    remains = Array(25 - items.length).fill(undefined);
  }

  return (
    <Flex alignItems={{ default: 'alignItemsFlexStart' }}>
      <Flex flex={{ default: 'flex_1' }}>
        <FlexItem>
          <TextContent>
            <Tooltip
              content={t(
                'The heatmap represents every issues related to a resource, using a color scale that depends on the severity, state and value amplitude.'
              )}
            >
              <Text component={TextVariants.h4}>
                <InfoAltIcon /> {t('Heatmap')}
              </Text>
            </Tooltip>
            {interactive && <Text component={TextVariants.p}>{t('Click on a cell to show the details.')}</Text>}
            <Text component={TextVariants.p}>
              {t('Gradient per severity: ')}
              <Grid>
                <GridItem span={4}>{t('info')}</GridItem>
                <GridItem span={8}>
                  <span className="gradient" style={{ backgroundImage: buildGradientCSS(infoColorMap) }} />
                </GridItem>
                <GridItem span={4}>{t('warning')}</GridItem>
                <GridItem span={8}>
                  <span className="gradient" style={{ backgroundImage: buildGradientCSS(warningColorMap) }} />
                </GridItem>
                <GridItem span={4}>{t('critical')}</GridItem>
                <GridItem span={8}>
                  <span className="gradient" style={{ backgroundImage: buildGradientCSS(criticalColorMap) }} />
                </GridItem>
              </Grid>
            </Text>
          </TextContent>
        </FlexItem>
      </Flex>
      <Flex flex={{ default: 'flex_1' }}>
        <FlexItem className="heatmap">
          {items.map((item, i) => {
            const style = getCellColors(item.score, 0, 1, item.colorMap);
            return (
              <div
                key={`heatmap_${i}`}
                className={'cell' + (item.selected ? ' selected' : '') + (interactive ? ' interactive' : '')}
                style={style}
                title={item.tooltip}
                onClick={item.onClick}
              />
            );
          })}
          {remains.map((_, i) => {
            return <div key={`heatmap_remains_${i}`} className={'cell greyed'} />;
          })}
        </FlexItem>
      </Flex>
      <div style={{ width: '100%' }} />
      <FlexItem className="details">
        {selectedItem && typeof selectedItem === 'string' && (
          <TextContent>
            <AlertDetailsValue title={t('No alert for this rule')}>{selectedItem}</AlertDetailsValue>
          </TextContent>
        )}
        {selectedItem && typeof selectedItem !== 'string' && (
          <AlertDetails alert={selectedItem} resourceName={info.name} />
        )}
      </FlexItem>
    </Flex>
  );
};
