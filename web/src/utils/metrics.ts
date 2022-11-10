import _ from 'lodash';
import { RawTopologyMetrics, MetricStats, TopologyMetricPeer, TopologyMetrics } from '../api/loki';
import { MetricFunction, MetricScope, MetricType } from '../model/flow-query';
import { roundTwoDigits } from './count';
import { computeStepInterval, rangeToSeconds, TimeRange } from './datetime';
import { byteRateFormat, byteFormat, simpleRateFormat, simpleValueFormat } from './format';
import { NodeData } from '../model/topology';

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
  isMock?: boolean
): TopologyMetrics[] => {
  const { start, end, step } = calibrateRange(
    raw.map(r => r.values),
    range,
    isMock
  );
  const metrics = raw.map(r => parseMetric(r, start, end, step, scope));

  // Disambiguate display names with kind when necessary
  if (scope === 'owner' || scope === 'resource') {
    // Define some helpers
    const getKind = scope === 'owner' ? (p: TopologyMetricPeer) => p.ownerType : (p: TopologyMetricPeer) => p.type;
    const addKind = (p: TopologyMetricPeer) => {
      if (p.displayName) {
        let existing = nameKinds.get(p.displayName);
        if (!existing) {
          existing = new Set();
          nameKinds.set(p.displayName, existing);
        }
        const k = getKind(p);
        if (k) {
          existing.add(k);
        }
      }
    };
    const disambiguate = (p: TopologyMetricPeer) => {
      if (p.displayName) {
        const kinds = nameKinds.get(p.displayName);
        if (kinds && kinds.size > 1) {
          let k = getKind(p);
          if (k) {
            k = shortKindMap[k] || k.toLowerCase();
            p.displayName = `${p.displayName} (${k})`;
          }
        }
      }
    };

    // First pass: extract all names+kind couples
    const nameKinds = new Map<string, Set<string>>();
    metrics.forEach(m => {
      addKind(m.source);
      addKind(m.destination);
    });

    // Second pass: update names if necessary
    metrics.forEach(m => {
      disambiguate(m.source);
      disambiguate(m.destination);
    });
  }
  return metrics;
};

const parseMetric = (
  raw: RawTopologyMetrics,
  start: number,
  end: number,
  step: number,
  scope: MetricScope
): TopologyMetrics => {
  const normalized = normalizeMetrics(raw.values, start, end, step);
  const stats = computeStats(normalized);

  const source: TopologyMetricPeer = {
    addr: raw.metric.SrcAddr,
    name: raw.metric.SrcK8S_Name,
    namespace: raw.metric.SrcK8S_Namespace,
    ownerName: raw.metric.SrcK8S_OwnerName,
    ownerType: raw.metric.SrcK8S_OwnerType,
    type: raw.metric.SrcK8S_Type,
    hostName: raw.metric.SrcK8S_HostName
  };
  const destination: TopologyMetricPeer = {
    addr: raw.metric.DstAddr,
    name: raw.metric.DstK8S_Name,
    namespace: raw.metric.DstK8S_Namespace,
    ownerName: raw.metric.DstK8S_OwnerName,
    ownerType: raw.metric.DstK8S_OwnerType,
    type: raw.metric.DstK8S_Type,
    hostName: raw.metric.DstK8S_HostName
  };
  source.displayName = buildPeerDisplayName(source, scope);
  destination.displayName = buildPeerDisplayName(destination, scope);
  return {
    source: source,
    destination: destination,
    values: normalized,
    stats: stats,
    scope: scope
  };
};

export const calibrateRange = (
  raw: [number, unknown][][],
  range: number | TimeRange,
  isMock?: boolean
): { start: number; end: number; step: number } => {
  // Extract some info based on range, and apply a tolerance about end range when it is close to "now"
  const info = computeStepInterval(range);
  const rangeInSeconds = rangeToSeconds(range);
  let start: number;
  let endWithTolerance: number;
  if (typeof range === 'number') {
    const end = Math.floor(new Date().getTime() / 1000);
    endWithTolerance = end - latencyTolerance;
    start = end - rangeInSeconds;
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

const buildPeerDisplayName = (peer: TopologyMetricPeer, scope: MetricScope): string | undefined => {
  switch (scope) {
    case 'host':
      return peer.hostName ? peer.hostName : peer.type === 'Node' ? peer.name : undefined;
    case 'namespace':
      return peer.namespace ? peer.namespace : peer.type === 'Namespace' ? peer.name : undefined;
    case 'owner':
      return peer.namespace && peer.ownerName
        ? `${peer.namespace}.${peer.ownerName}`
        : peer.ownerName
        ? peer.ownerName
        : undefined;
    case 'resource':
    default:
      return peer.namespace && peer.name
        ? `${peer.namespace}.${peer.name}`
        : peer.name
        ? peer.name
        : peer.addr || undefined;
  }
};

export const getFormattedValue = (v: number, mt: MetricType, mf: MetricFunction): string => {
  if (mf === 'sum') {
    switch (mt) {
      case 'bytes':
        return byteFormat(v);
      case 'packets':
        return simpleValueFormat(v);
    }
  } else {
    return getFormattedRateValue(v, mt);
  }
};

export const getFormattedRateValue = (v: number, mt: MetricType): string => {
  switch (mt) {
    case 'bytes':
      return byteRateFormat(v);
    case 'packets':
      return simpleRateFormat(v);
  }
};

const matchPeerInternal = (
  peer: TopologyMetricPeer,
  kind?: string,
  name?: string,
  namespace?: string,
  addr?: string
): boolean => {
  return (
    (kind === 'Namespace' && name === peer.namespace) ||
    (kind === 'Node' && name === peer.hostName) ||
    /* For owner nodes */ (kind &&
      kind === peer.ownerType &&
      name === peer.ownerName &&
      namespace === peer.namespace) ||
    /* For resource nodes */ (kind && kind === peer.type && addr === peer.addr) ||
    /* For unknown nodes */ (!kind && !peer.displayName && addr === peer.addr)
  );
};

export const matchPeer = (data: NodeData, peer: TopologyMetricPeer): boolean => {
  if (data.parentKind && data.parentName && !matchPeerInternal(peer, data.parentKind, data.parentName)) {
    return false;
  }
  return matchPeerInternal(peer, data.resourceKind, data.name, data.namespace, data.addr);
};

export const peersEqual = (p1: TopologyMetricPeer, p2: TopologyMetricPeer): boolean =>
  p1.displayName === p2.displayName;
export const isUnknownPeer = (peer: TopologyMetricPeer): boolean => peer.displayName === undefined;
