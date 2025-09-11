import { AlertStates } from '@openshift-console/dynamic-plugin-sdk';
import { AlertWithRuleName, ByResource, computeAlertScore, computeScore } from '../helper';

const mockAlert = (
  name: string,
  severity: string,
  state: string,
  threshold: number,
  value: number
): AlertWithRuleName => {
  return {
    ruleName: name,
    labels: { alertname: name, severity: severity },
    state: state as AlertStates,
    annotations: {},
    ruleID: '',
    metadata: { thresholdF: threshold, threshold: '', unit: '%' },
    value: value
  };
};

describe('health helpers', () => {
  it('should compute unweighted alert min score', () => {
    const alert = mockAlert('test', 'critical', 'firing', 10, 10);
    const score = computeAlertScore(alert);
    expect(score.rawScore).toBeCloseTo(9.47, 2);
    expect(score.weight).toEqual(1);
  });

  it('should compute unweighted alert max score', () => {
    const alert = mockAlert('test', 'critical', 'firing', 10, 100);
    const score = computeAlertScore(alert);
    expect(score.rawScore).toEqual(0);
    expect(score.weight).toEqual(1);
  });

  it('should compute weighted alert score', () => {
    const alert = mockAlert('test', 'info', 'pending', 10, 10);
    const score = computeAlertScore(alert);
    expect(score.rawScore).toBeCloseTo(9.47, 2);
    expect(score.weight).toEqual(0.12);
  });

  it('should compute full score', () => {
    // Start with an empty one => max score
    const r: ByResource = {
      name: 'test',
      critical: { firing: [], pending: [], silenced: [], inactive: [] },
      warning: { firing: [], pending: [], silenced: [], inactive: [] },
      other: { firing: [], pending: [], silenced: [], inactive: [] },
      score: { total: 0, details: [] }
    };
    expect(computeScore(r).total).toEqual(10);

    // Add 3 inactive alerts => still max score
    r.critical.inactive.push('test-critical');
    r.warning.inactive.push('test-warning');
    r.other.inactive.push('test-info');
    expect(computeScore(r).total).toEqual(10);

    // Turn the inactive info into pending => slightly decreasing score
    r.other.inactive = [];
    r.other.pending = [mockAlert('test-info', 'info', 'pending', 10, 20)];
    expect(computeScore(r).total).toBeCloseTo(9.9, 1);

    // Turn the inactive warning into firing => more decreasing score
    r.warning.inactive = [];
    r.warning.firing = [mockAlert('test-warning', 'warning', 'firing', 10, 40)];
    expect(computeScore(r).total).toBeCloseTo(8.5, 1);

    // Turn the inactive critical into firing => more decrease
    r.critical.inactive = [];
    r.critical.firing = [mockAlert('test-critical', 'critical', 'firing', 10, 40)];
    expect(computeScore(r).total).toBeCloseTo(6.5, 1);
  });
});
