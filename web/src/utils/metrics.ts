import _ from 'lodash';
import {
  RawTopologyMetrics,
  MetricStats,
  TopologyMetricPeer,
  TopologyMetrics,
  NameAndType,
  DroppedTopologyMetrics
} from '../api/loki';
import { MetricFunction, MetricScope, MetricType } from '../model/flow-query';
import { roundTwoDigits } from './count';
import { computeStepInterval, rangeToSeconds, TimeRange } from './datetime';
import { valueFormat } from './format';
import { NodeData } from '../model/topology';
import { getPeerId, idUnknown } from './ids';
import { TFunction } from 'i18next';
import { getCause, getState } from './tcp-drop';

// Tolerance, in seconds, to assume presence/emptiness of the last datapoint fetched, when it is
// close to "now", to accomodate with potential collection latency.
// Past this tolerance delay, missing datapoints are considered being 0.
const latencyTolerance = 120;

const shortKindMap: { [k: string]: string } = {
  Service: 'svc',
  Deployment: 'depl',
  DaemonSet: 'ds',
  StatefulSet: 'sts'
};

export const parseMetrics = (
  raw: RawTopologyMetrics[],
  range: number | TimeRange,
  scope: MetricScope,
  unixTimestamp: number,
  isMock?: boolean
): (TopologyMetrics | DroppedTopologyMetrics)[] => {
  const { start, end, step } = calibrateRange(
    raw.map(r => r.values),
    range,
    unixTimestamp,
    isMock
  );
  const metrics = raw.map(r => parseMetric(r, start, end, step, scope));

  // Disambiguate display names with kind when necessary
  if (scope === 'owner' || scope === 'resource') {
    // Define some helpers
    const addKind = (p: TopologyMetricPeer) => {
      const name = p.getDisplayName(true, false);
      if (name) {
        let existing = nameKinds.get(name);
        if (!existing) {
          existing = new Set();
          nameKinds.set(name, existing);
        }
        if (p.resourceKind) {
          existing.add(p.resourceKind);
        }
      }
    };
    const checkAmbiguous = (p: TopologyMetricPeer) => {
      const name = p.getDisplayName(true, false);
      if (name) {
        const kinds = nameKinds.get(name);
        if (kinds && kinds.size > 1 && p.resourceKind) {
          p.isAmbiguous = true;
        }
      }
    };

    // First pass: extract all names+kind couples
    const nameKinds = new Map<string, Set<string>>();
    metrics.forEach((m: TopologyMetrics) => {
      addKind(m.source);
      addKind(m.destination);
    });

    // Second pass: mark if ambiguous
    metrics.forEach((m: TopologyMetrics) => {
      checkAmbiguous(m.source);
      checkAmbiguous(m.destination);
    });
  }
  return metrics;
};

export const createPeer = (fields: Partial<TopologyMetricPeer>): TopologyMetricPeer => {
  const newPeer: TopologyMetricPeer = {
    id: getPeerId(fields),
    addr: fields.addr,
    resource: fields.resource,
    namespace: fields.namespace,
    owner: fields.owner,
    hostName: fields.hostName,
    isAmbiguous: false,
    getDisplayName: () => undefined
  };
  const setForNameAndType = (nt: NameAndType) => {
    const { type, name } = nt;
    newPeer.resourceKind = type;
    newPeer.getDisplayName = (inclNamespace, disambiguate) => {
      const disamb = disambiguate && newPeer.isAmbiguous ? ` (${shortKindMap[type] || type.toLowerCase()})` : '';
      return (newPeer.namespace && inclNamespace ? `${newPeer.namespace}.${name}` : name) + disamb;
    };
  };

  if (fields.resource) {
    // Resource kind
    setForNameAndType(fields.resource);
  } else if (fields.owner) {
    // Owner kind
    setForNameAndType(fields.owner);
  } else if (fields.namespace) {
    // Since name / ownerName aren't defined then it must be a namespace-kind aggregation
    newPeer.resourceKind = 'Namespace';
    newPeer.getDisplayName = () => fields.namespace;
  } else if (fields.hostName) {
    // Since name isn't defined then it must be a host-kind aggregation
    newPeer.resourceKind = 'Node';
    newPeer.getDisplayName = () => fields.hostName;
  } else if (fields.addr) {
    newPeer.getDisplayName = () => fields.addr;
  }
  return newPeer;
};

const nameAndType = (name?: string, type?: string): NameAndType | undefined => {
  return name && type ? { name, type } : undefined;
};

const parseMetric = (
  raw: RawTopologyMetrics,
  start: number,
  end: number,
  step: number,
  scope: MetricScope
): TopologyMetrics | DroppedTopologyMetrics => {
  const normalized = normalizeMetrics(raw.values, start, end, step);
  const stats = computeStats(normalized);
  if (scope === 'droppedState') {
    return {
      value: raw.metric.TcpDropState,
      name: getState(raw.metric.TcpDropState),
      values: normalized,
      stats: stats,
      scope: scope
    } as DroppedTopologyMetrics;
  } else if (scope === 'droppedCause') {
    return {
      value: raw.metric.TcpDropCause,
      name: getCause(raw.metric.TcpDropCause),
      values: normalized,
      stats: stats,
      scope: scope
    } as DroppedTopologyMetrics;
  } else {
    const source = createPeer({
      addr: raw.metric.SrcAddr,
      resource: nameAndType(raw.metric.SrcK8S_Name, raw.metric.SrcK8S_Type),
      owner: nameAndType(raw.metric.SrcK8S_OwnerName, raw.metric.SrcK8S_OwnerType),
      namespace: raw.metric.SrcK8S_Namespace,
      hostName: raw.metric.SrcK8S_HostName
    });
    const destination = createPeer({
      addr: raw.metric.DstAddr,
      resource: nameAndType(raw.metric.DstK8S_Name, raw.metric.DstK8S_Type),
      owner: nameAndType(raw.metric.DstK8S_OwnerName, raw.metric.DstK8S_OwnerType),
      namespace: raw.metric.DstK8S_Namespace,
      hostName: raw.metric.DstK8S_HostName
    });
    return {
      source: source,
      destination: destination,
      values: normalized,
      stats: stats,
      scope: scope
    } as TopologyMetrics;
  }
};

export const calibrateRange = (
  raw: [number, unknown][][],
  range: number | TimeRange,
  unixTimestamp: number,
  isMock?: boolean
): { start: number; end: number; step: number } => {
  // Extract some info based on range, and apply a tolerance about end range when it is close to "now"
  const info = computeStepInterval(range);
  const rangeInSeconds = rangeToSeconds(range);
  let start: number;
  let endWithTolerance: number;
  if (typeof range === 'number') {
    endWithTolerance = unixTimestamp - latencyTolerance;
    start = unixTimestamp - rangeInSeconds;
  } else {
    start = range.from;
    endWithTolerance = range.to;
  }

  let firstTimestamp = start;
  // Calibrate start date based on actual timestamps, to avoid inaccurate stepping from there
  //  (which screws up the chart display)
  const allFirsts = raw.filter(dp => dp.length > 0).map(dp => dp[0][0]);
  if (allFirsts.length > 0) {
    firstTimestamp = Math.min(...allFirsts);
    while (firstTimestamp > start) {
      firstTimestamp -= info.stepSeconds;
    }
  }

  // End time needs to be overridden to avoid huge range since mock is outdated compared to current date
  if (isMock) {
    endWithTolerance = Math.max(...raw.filter(dp => dp.length > 0).map(dp => dp[dp.length - 1][0]));
  }

  return {
    start: firstTimestamp,
    end: endWithTolerance,
    step: info.stepSeconds
  };
};

/**
 * normalizeMetrics fills all missing or NaN datapoints with zeros
 */
export const normalizeMetrics = (
  values: [number, unknown][],
  start: number,
  end: number,
  step: number
): [number, number][] => {
  // Normalize by counting all NaN as zeros
  const normalized: [number, number][] = values.map(dp => {
    let val = Number(dp[1]);
    if (_.isNaN(val)) {
      val = 0;
    }
    return [dp[0], val];
  });

  // Normalize by filling missing datapoints with zeros
  const tolerance = step / 2;
  for (let current = start; current < end; current += step) {
    if (!normalized.some(rv => rv[0] > current - tolerance && rv[0] < current + tolerance)) {
      normalized.push([current, 0]);
    }
  }

  return normalized.sort((a, b) => a[0] - b[0]);
};

/**
 * computeStats computes avg, max and total. Input metric is always the bytes rate (Bps).
 */
export const computeStats = (ts: [number, number][]): MetricStats => {
  if (ts.length === 0) {
    return { latest: 0, avg: 0, max: 0, total: 0 };
  }
  const values = ts.map(dp => dp[1]);

  // Compute stats
  const sum = values.reduce((prev, cur) => prev + cur, 0);
  const avg = sum / values.length;
  const max = Math.max(...values);
  const latest = values[values.length - 1];

  return {
    latest: roundTwoDigits(latest),
    avg: roundTwoDigits(avg),
    max: roundTwoDigits(max),
    total: Math.floor(avg * (ts[ts.length - 1][0] - ts[0][0]))
  };
};

export const getFormattedValue = (v: number, mt: MetricType, mf: MetricFunction, t: TFunction): string => {
  if (mt === 'count') {
    return valueFormat(v);
  } else if (mf === 'sum') {
    switch (mt) {
      case 'droppedBytes':
      case 'bytes':
        return valueFormat(v, 1, t('B'));
      case 'droppedPackets':
      case 'packets':
        return valueFormat(v, 1, t('P'));
    }
  } else {
    return getFormattedRateValue(v, mt, t);
  }
};

export const getFormattedRateValue = (v: number, mt: MetricType, t: TFunction): string => {
  switch (mt) {
    case 'count':
      return valueFormat(v);
    case 'droppedBytes':
    case 'bytes':
      return valueFormat(v, 1, t('Bps'));
    case 'droppedPackets':
    case 'packets':
      return valueFormat(v, 1, t('Pps'));
  }
};

// matchPeer returns true is the peer id (= a given metric) equals, or contains the node id
//  E.g: peer id "h=host1,n=ns2,o=Deployment.depl-a,r=Pod.depl-a-12345,a=1.2.3.7" contains group id "h=host1"
export const matchPeer = (data: NodeData, peer: TopologyMetricPeer): boolean => {
  if (data.peer.id === idUnknown) {
    return peer.id === idUnknown;
  }
  return peer.id.includes(data.peer.id);
};

export const isUnknownPeer = (peer: TopologyMetricPeer): boolean => peer.id === idUnknown;
