import * as React from "react";

import { ParsedStream } from "../api/loki";
import { Tr, Td } from "@patternfly/react-table";
import { Column, ColumnsId } from "./netflow-table-header";
import protocols from "protocol-numbers";

import { ResourceLink } from "@openshift-console/dynamic-plugin-sdk";

const NetflowTableRow: React.FC<{ flow: ParsedStream; columns: Column[] }> = ({
  flow,
  columns,
}) => {
  const content = (c) => {
    switch (c.id) {
      case ColumnsId.date: {
        return new Date(flow.value.timestamp).toLocaleString();
      }
      case ColumnsId.srcpod: {
        if (flow.value.IPFIX.SrcPod) {
          return (
            <ResourceLink
              kind="Pod"
              name={flow.value.IPFIX.SrcPod}
              namespace={flow.labels["SrcNamespace"]}
            />
          );
        } else {
          return "";
        }
      }
      case ColumnsId.dstpod: {
        if (flow.value.IPFIX.DstPod) {
          return (
            <ResourceLink
              kind="Pod"
              name={flow.value.IPFIX.DstPod}
              namespace={flow.labels["DstNamespace"]}
            />
          );
        } else {
          return "";
        }
      }
      case ColumnsId.srcnamespace: {
        if (flow.labels["SrcNamespace"]) {
          return (
            <ResourceLink kind="Namespace" name={flow.labels["SrcNamespace"]} />
          );
        } else {
          return "";
        }
      }
      case ColumnsId.dstnamespace: {
        if (flow.labels["DstNamespace"]) {
          return (
            <ResourceLink kind="Namespace" name={flow.labels["DstNamespace"]} />
          );
        } else {
          return "";
        }
      }
      case ColumnsId.srcport: {
        return flow.value.IPFIX.SrcPort;
      }
      case ColumnsId.dstport: {
        return flow.value.IPFIX.DstPort;
      }
      case ColumnsId.protocol: {
        return protocols[flow.value.IPFIX.Proto].name;
      }
      case ColumnsId.bytes: {
        return flow.value.IPFIX.Bytes;
      }
      case ColumnsId.packets: {
        return flow.value.IPFIX.Packets;
      }
    }
  };
  return (
    <Tr>
      {columns.map((c) => (
        <Td key="{c.id}">{content(c)}</Td>
      ))}
    </Tr>
  );
};

export default NetflowTableRow;
