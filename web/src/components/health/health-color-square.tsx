import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { valueFormat } from '../../utils/format';
import {
  AlertWithRuleName,
  computeAlertScore,
  computeExcessRatioStatusWeighted,
  RecordingRuleItem
} from './health-helper';

import { Tooltip } from '@patternfly/react-core';
import './health-color-square.css';

export interface HealthColorSquareProps {
  alert?: AlertWithRuleName;
  recordingRule?: RecordingRuleItem;
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
  { r: 228, g: 245, b: 188 },
  { r: 154, g: 216, b: 216 },
  { r: 62, g: 134, b: 53 }
];

const getCellColors = (value: number, rangeFrom: number, rangeTo: number, colorMap: ColorMap) => {
  // Ensure value is valid and within range
  if (!isFinite(value) || isNaN(value)) {
    value = rangeFrom;
  }

  const clamped = Math.max(rangeFrom, Math.min(rangeTo, value));
  const ratio = (clamped - rangeFrom) / (rangeTo - rangeFrom); // e.g. 0.8 | 0 | 1
  const colorRatio = ratio * (colorMap.length - 1); // e.g. (length is 3) 1.6 | 0 | 2

  // Ensure indices are within bounds
  const lowIndex = Math.min(Math.max(0, Math.floor(colorRatio)), colorMap.length - 1);
  const highIndex = Math.min(Math.max(0, Math.ceil(colorRatio)), colorMap.length - 1);

  const colorLow = colorMap[lowIndex];
  const colorHigh = colorMap[highIndex];
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

export const HealthColorSquare: React.FC<HealthColorSquareProps> = ({ alert, recordingRule }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const scoreData = React.useMemo(() => {
    if (alert) {
      // Alert mode
      const severity = alert.labels.severity;
      const scoreForMap = computeExcessRatioStatusWeighted(alert);
      const score = computeAlertScore(alert);
      return {
        severity,
        scoreForMap,
        rawScore: score.rawScore,
        weight: score.weight
      };
    } else if (recordingRule) {
      // Recording rule mode
      const severity = recordingRule.severity;

      // Calculate excess ratio similar to computeRecordingRulesScore
      const thresholdValue = recordingRule.threshold ? parseFloat(recordingRule.threshold) : 0;
      const upperBoundValue = recordingRule.upperBound ? parseFloat(recordingRule.upperBound) : 100;

      let scoreForMap: number;
      if (thresholdValue > 0 && upperBoundValue > thresholdValue) {
        const threshold = thresholdValue / 2;
        const vclamped = Math.min(Math.max(recordingRule.value, threshold), upperBoundValue);
        const range = upperBoundValue - threshold;
        if (range > 0) {
          scoreForMap = (vclamped - threshold) / range;
        } else {
          scoreForMap = 0;
        }
      } else {
        scoreForMap = 0;
      }

      // Clamp scoreForMap to [0, 1] range
      scoreForMap = Math.max(0, Math.min(1, scoreForMap));

      const rawScore = 10 * (1 - scoreForMap);

      // Weight based on severity
      const weight = severity === 'critical' ? 100 : severity === 'warning' ? 10 : 1;

      return {
        severity,
        scoreForMap,
        rawScore,
        weight
      };
    }
    return null;
  }, [alert, recordingRule]);

  if (!scoreData || !scoreData.severity) {
    return null;
  }

  const { severity, scoreForMap, rawScore, weight } = scoreData;

  const colorMap = severity === 'critical' ? criticalColorMap : severity === 'warning' ? warningColorMap : infoColorMap;

  return (
    <Tooltip
      content={
        <>
          {t('Score') + ': ' + valueFormat(rawScore)}
          <br />
          {t('Weight') + ': ' + weight}
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
