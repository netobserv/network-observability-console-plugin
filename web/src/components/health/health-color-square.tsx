import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { valueFormat } from '../../utils/format';
import { AlertWithRuleName, computeAlertScore, computeExcessRatioStatusWeighted } from './health-helper';

import { Tooltip } from '@patternfly/react-core';
import './health-color-square.css';

export interface HealthColorSquareProps {
  alert: AlertWithRuleName;
}

// rgb in [0,255] bounds
type Color = { r: number; g: number; b: number };
type ColorMap = Color[];

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

export const HealthColorSquare: React.FC<HealthColorSquareProps> = ({ alert }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const colorMap =
    alert.labels.severity === 'critical'
      ? criticalColorMap
      : alert.labels.severity === 'warning'
      ? warningColorMap
      : infoColorMap;

  const scoreForMap = computeExcessRatioStatusWeighted(alert);
  const score = computeAlertScore(alert);

  return (
    <Tooltip
      content={
        <>
          {t('Score') + ': ' + valueFormat(score.rawScore)}
          <br />
          {t('Weight') + ': ' + score.weight}
          <br />
          <div className="gradient" style={{ backgroundImage: buildGradientCSS(colorMap) }}>
            <span className="vertical-mark" style={{ width: 100 * scoreForMap + '%' }} />
          </div>
        </>
      }
    >
      <div className={'cell'} style={getCellColors(scoreForMap, 0, 1, colorMap)} />
    </Tooltip>
  );
};
