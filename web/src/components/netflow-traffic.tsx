import * as React from 'react';
import * as _ from 'lodash';
import {
  useResolvedExtensions,
  isModelFeatureFlag,
  ModelFeatureFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { getFlows } from '../api/routes';
import { ParsedStream } from '../api/loki';
import NetflowTable from './netflow-table';
import {
  PageSection,
  Button,
} from '@patternfly/react-core';
import { Column, ColumnsId } from './netflow-table-header';
import { useTranslation } from "react-i18next";
import { SyncAltIcon } from '@patternfly/react-icons';
import { RefreshDropdown } from './refresh-dropdown';
import { usePoll } from '../utils/poll-hook';
import "./netflow-traffic.css"

export const NetflowTraffic: React.FC = () => {
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  const [loading, setLoading] = React.useState(false);
  const [flows, setFlows] = React.useState<ParsedStream[]>([]);
  const [error, setError] = React.useState(undefined);
  const { t } = useTranslation("plugin__network-observability-plugin");

  //TODO refactor once we have column selector
  const Columns: Column[] = [
    { id: ColumnsId.date, name: t("Date & time") },
    { id: ColumnsId.srcpod, name: t("Src pod") },
    { id: ColumnsId.dstpod, name: t("Dst pod") },
    { id: ColumnsId.srcnamespace, name: t("Src namespace") },
    { id: ColumnsId.dstnamespace, name: t("Dst namespace") },
    { id: ColumnsId.srcport, name: t("Src port") },
    { id: ColumnsId.dstport, name: t("Dst port") },
    { id: ColumnsId.protocol, name: t("Protocol") },
    { id: ColumnsId.bytes, name: t("Bytes") },
    { id: ColumnsId.packets, name: t("Packets") },
  ];

  const [interval, setInterval] = React.useState<number | null>(null)
  const tick = () => {
    setLoading(true);
    getFlows()
      .then(streams => {
        setFlows(streams);
        setError(undefined);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      })
  };
  usePoll(tick, interval);

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection">
      <h1 className="co-m-pane__heading">
        <span>Network Traffic</span>
        <div className="co-actions">
          <RefreshDropdown
            id="refresh-dropdown"
            interval={interval}
            setInterval={setInterval} />
          <Button
            id="refresh-button"
            className="co-action-refresh-button"
            variant="primary"
            onClick={() => tick()}
            icon={
              <SyncAltIcon style={{ animation: `spin ${loading ? 1 : 0}s linear infinite` }} />
            } />
        </div>
      </h1>
      {error && (
        <div>Error: {error}</div>
      )}
      {!_.isEmpty(flows) &&
        <NetflowTable
          flows={flows}
          setFlows={setFlows}
          columns={Columns} />
      }
    </PageSection>) : null;
};

export default NetflowTraffic;
