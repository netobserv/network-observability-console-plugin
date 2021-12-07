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
    PageSection
} from '@patternfly/react-core';

import { Column, ColumnsId } from './netflow-table-header';
import { useTranslation } from "react-i18next";

const NetflowTraffic: React.FC = () => {
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
  React.useEffect(() => {
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
  }, [false /*temp: no refresh*/]);

    return !_.isEmpty(extensions) ? (
	<PageSection>
	    <h2>Network Traffic</h2>
	    {loading && <>Loading...</>}
	    {error && (
		<div>Error: {error}</div>
	    )}
	{!_.isEmpty(flows) &&
	 <NetflowTable flows={flows} setFlows={setFlows} columns={Columns} />
	}
	</PageSection>
    ) : null;
};

export default NetflowTraffic;
