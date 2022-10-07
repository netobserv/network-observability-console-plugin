import _ from 'lodash';
import { RawTopologyMetrics, MetricStats, TopologyMetricPeer, TopologyMetrics } from '../api/loki';
import { MetricFunction, MetricScope, MetricType } from '../model/flow-query';
import { elementPerMinText, roundTwoDigits } from './count';
import { computeStepInterval, getRangeEnd, rangeToSeconds, TimeRange } from './datetime';
import { bytesPerSeconds, humanFileSize } from './bytes';
import { NodeData } from '../model/topology';

const shortKindMap: { [k: string]: string } = {
  Service: 'svc',
  Deployment: 'depl',
  DaemonSet: 'ds',
  StatefulSet: 'sts'
};

export const parseMetrics = (
  raw: RawTopologyMetrics[],
  range: number | TimeRange,
  scope: MetricScope
): TopologyMetrics[] => {
  const metrics = raw.map(r => parseMetric(r, range, scope));

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

const parseMetric = (raw: RawTopologyMetrics, range: number | TimeRange, scope: MetricScope): TopologyMetrics => {
  const stats = computeStats(raw.values, range);
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
    values: raw.values,
    stats: stats
  };
};

/**
 * computeStats computes avg, max and total. Input metric is always the bytes rate (Bps).
 */
export const computeStats = (values: (string | number)[][], range: number | TimeRange): MetricStats => {
  const filtered = values.map(dp => Number(dp[1])).filter(v => !_.isNaN(v));
  if (filtered.length === 0) {
    return { latest: 0, avg: 0, max: 0, total: 0 };
  }

  // TODO: fill missing dp with 0

  // Figure out what's the expected number of datapoints, because series may not contain all datapoints
  // We'll assume that missing datapoints are zeros
  const info = computeStepInterval(range);
  const rangeInSeconds = rangeToSeconds(range);
  const expectedDatapoints = Math.floor(rangeInSeconds / info.stepSeconds);

  // Compute stats
  const sum = filtered.reduce((prev, cur) => prev + cur, 0);
  const avg = sum / expectedDatapoints;
  const max = Math.max(...filtered);

  // Get last datapoint. If the serie ends too early before the expected end range, we assume it's 0
  // (with a tolerance margin)
  const tolerance = 5 * info.stepSeconds;
  const endRange = getRangeEnd(range).getTime() / 1000;
  const lastDP = values[values.length - 1] as [number, string];
  const latest = lastDP[0] >= endRange - tolerance ? Number(lastDP[1]) : 0;

  return {
    latest: roundTwoDigits(latest),
    avg: roundTwoDigits(avg),
    max: roundTwoDigits(max),
    total: Math.floor(avg * rangeInSeconds)
  };
};

const buildPeerDisplayName = (peer: TopologyMetricPeer, scope: MetricScope): string | undefined => {
  switch (scope) {
    case 'host':
      return peer.hostName ? peer.hostName : peer.type === 'Node' ? peer.name! : undefined;
    case 'namespace':
      return peer.namespace ? peer.namespace : peer.type === 'Namespace' ? peer.name! : undefined;
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
        return humanFileSize(v, true, 0);
      case 'packets':
        return String(v);
    }
  } else {
    return getFormattedRateValue(v, mt);
  }
};

export const getFormattedRateValue = (v: number, mt: MetricType): string => {
  switch (mt) {
    case 'bytes':
      return bytesPerSeconds(v);
    case 'packets':
      return elementPerMinText(v);
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
