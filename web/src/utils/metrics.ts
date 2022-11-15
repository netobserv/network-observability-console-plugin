import _ from 'lodash';
import { RawTopologyMetrics, MetricStats, TopologyMetricPeer, TopologyMetrics } from '../api/loki';
import { MetricFunction, MetricScope, MetricType } from '../model/flow-query';
import { roundTwoDigits } from './count';
import { computeStepInterval, rangeToSeconds, TimeRange } from './datetime';
import { byteRateFormat, byteFormat, simpleRateFormat, simpleValueFormat } from './format';
import { NodeData } from '../model/topology';
import { getPeerId, idUnknown } from './ids';

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
    const addKind = (p: TopologyMetricPeer) => {
      if (p.displayName) {
        let existing = nameKinds.get(p.displayName);
        if (!existing) {
          existing = new Set();
          nameKinds.set(p.displayName, existing);
        }
        if (p.resourceKind) {
          existing.add(p.resourceKind);
        }
      }
    };
    const disambiguate = (p: TopologyMetricPeer) => {
      if (p.displayName) {
        const kinds = nameKinds.get(p.displayName);
        if (kinds && kinds.size > 1) {
          if (p.resourceKind) {
            const shortKind = shortKindMap[p.resourceKind] || p.resourceKind.toLowerCase();
            p.displayName = `${p.displayName} (${shortKind})`;
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

export const peerNameAndKind = (
  fields: Partial<TopologyMetricPeer>,
  inclNamespace: boolean
): { name: string; kind?: string } | undefined => {
  if (fields.resource) {
    // Resource kind
    const name =
      fields.namespace && inclNamespace ? `${fields.namespace}.${fields.resource.name}` : fields.resource.name;
    return { name, kind: fields.resource.type };
  }
  if (fields.owner) {
    // Owner kind
    const name = fields.namespace && inclNamespace ? `${fields.namespace}.${fields.owner.name}` : fields.owner.name;
    return { name, kind: fields.owner.type };
  }
  if (fields.namespace) {
    // Since name / ownerName aren't defined then it must be a namespace-kind aggregation
    return { name: fields.namespace, kind: 'Namespace' };
  }
  if (fields.hostName) {
    // Since name isn't defined then it must be a host-kind aggregation
    return { name: fields.hostName, kind: 'Node' };
  }
  return fields.addr ? { name: fields.addr } : undefined;
};

export const createPeer = (fields: Omit<TopologyMetricPeer, 'id'>): TopologyMetricPeer => {
  const nk = peerNameAndKind(fields, true);
  return {
    id: getPeerId(fields),
    addr: fields.addr,
    resource: fields.resource,
    namespace: fields.namespace,
    owner: fields.owner,
    hostName: fields.hostName,
    resourceKind: nk?.kind,
    displayName: nk?.name
  };
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
  const source = createPeer({
    addr: raw.metric.SrcAddr,
    resource:
      raw.metric.SrcK8S_Name && raw.metric.SrcK8S_Type
        ? {
            name: raw.metric.SrcK8S_Name,
            type: raw.metric.SrcK8S_Type
          }
        : undefined,
    owner:
      raw.metric.SrcK8S_OwnerName && raw.metric.SrcK8S_OwnerType
        ? {
            name: raw.metric.SrcK8S_OwnerName,
            type: raw.metric.SrcK8S_OwnerType
          }
        : undefined,
    namespace: raw.metric.SrcK8S_Namespace,
    hostName: raw.metric.SrcK8S_HostName
  });
  const destination = createPeer({
    addr: raw.metric.DstAddr,
    resource:
      raw.metric.DstK8S_Name && raw.metric.DstK8S_Type
        ? {
            name: raw.metric.DstK8S_Name,
            type: raw.metric.DstK8S_Type
          }
        : undefined,
    owner:
      raw.metric.DstK8S_OwnerName && raw.metric.DstK8S_OwnerType
        ? {
            name: raw.metric.DstK8S_OwnerName,
            type: raw.metric.DstK8S_OwnerType
          }
        : undefined,
    namespace: raw.metric.DstK8S_Namespace,
    hostName: raw.metric.DstK8S_HostName
  });
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

// matchPeer returns true is the peer id (= a given metric) equals, or contains the node id
//  E.g: peer id "h=host1,n=ns2,o=Deployment.depl-a,r=Pod.depl-a-12345,a=1.2.3.7" contains group id "h=host1"
export const matchPeer = (data: NodeData, peer: TopologyMetricPeer): boolean => {
  if (data.peer.id === idUnknown) {
    return peer.id === idUnknown;
  }
  return peer.id.includes(data.peer.id);
};

export const isUnknownPeer = (peer: TopologyMetricPeer): boolean => peer.displayName === undefined;
