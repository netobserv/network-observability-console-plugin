/// <reference types="cypress" />
import r from './../../../../mocks/loki/flow_records.json';

describe('netflow-table', () => {
  const updatedData = r;
  updatedData.data.result.forEach(r => {
    r.values.forEach(v => {
      if(v[1].includes("NetworkEvents")){
        // need to inject network events manually since this is done on backend side. See NetworkEventsToString func
        // eslint-disable-next-line max-len
        v[1] = "{\"TimeFlowRttNs\":7114000,\"DstPort\":50104,\"TimeFlowStartMs\":1708011867121,\"Proto\":1,\"AgentIP\":\"10.0.1.7\",\"Etype\":2048,\"Bytes\":226,\"DstK8S_Name\":\"ip-10-0-1-7.ec2.internal\",\"DstAddr\":\"10.0.1.7\",\"DstK8S_HostName\":\"ip-10-0-1-7.ec2.internal\",\"DstK8S_OwnerType\":\"Node\",\"SrcAddr\":\"10.0.1.140\",\"Packets\":1,\"TimeFlowEndMs\":1708011867121,\"DstK8S_HostIP\":\"10.0.1.7\",\"Duplicate\":true,\"TimeReceived\":1708011867,\"SrcPort\":443,\"Flags\":16,\"IfDirection\":0,\"DnsErrno\":0,\"SrcMac\":\"02:7B:32:68:BE:65\",\"Interface\":\"br-ex\",\"Dscp\":0,\"DstMac\":\"02:27:A1:A8:84:B9\",\"IcmpType\":3,\"IcmpCode\":0,\"NetworkEvents\":[\"Allowed by default allow from local node policy, direction Ingress\"]}";
      }
    });
  });

  beforeEach(() => {
    // this test bench only work with mocks
    cy.intercept('GET', '/api/loki/flow/records?*', {
      statusCode: 200,
      body: r.data,
    });
    cy.intercept('/api/frontend-config', (req) => {
      req.continue((res) => {
        switch (Cypress.currentTest.title) {
          case 'display pktDrop':
            res.body.features = ['pktDrop'];
            break;
          case 'display dnsTracking':
            res.body.features = ['dnsTracking'];
            break;
          case 'display flowRTT':
            res.body.features = ['flowRTT'];
            break;
          case 'display multiCluster':
            res.body.features = ['multiCluster'];
            break;
          case 'display zones':
            res.body.features = ['zones'];
            break;
          case 'display networkEvents':
            res.body.features = ['networkEvents'];
            break;
          default:
            // disable all features by default
            res.body.featutes = [];
            break;
        }
      });
    });
    cy.openNetflowTrafficPage(true);

    // move to table view
    cy.get('.tableTabButton').click();
    // clear default app filters
    cy.get('#clear-all-filters-button').click();
  });

  it('display standard content', () => {
    // select first row
    cy.get('#netflow-table-row-0').click();

    // check for side panel content
    // dates
    //cy.checkRecordField('StartTime', 'Start Time', ['Feb 15, 2024', '4:44:27.121 PM']);
    //cy.checkRecordField('EndTime', 'End Time', ['Feb 15, 2024', '4:44:27.121 PM']);

    // source accordion
    cy.get('[data-test-id="group-2"]').contains("Source");
    cy.checkRecordField('SrcK8S_Name', 'Name', ['N', 'ip-10-0-1-7.ec2.internal']);
    cy.checkRecordField('SrcK8S_Type', 'Kind', ['Node']);
    cy.checkRecordField('SrcAddr', 'IP', ['10.0.1.7']);
    cy.checkRecordField('SrcPort', 'Port', ['50104']);
    cy.checkRecordField('SrcMac', 'MAC', ['02:27:A1:A8:84:B9']);

    // destination accordion
    cy.get('[data-test-id="group-3"]').contains("Destination");
    cy.checkRecordField('DstAddr', 'IP', ['10.0.1.140']);
    cy.checkRecordField('DstPort', 'Port', ['https', '443']);
    cy.checkRecordField('DstMac', 'MAC', ['02:7B:32:68:BE:65']);

    // others
    cy.checkRecordField('K8S_FlowLayer', 'Flow layer', ['infra']);

    cy.get('[data-test-id="group-5"]').contains("L3 Layer");
    cy.checkRecordField('Proto', 'Protocol', ['ICMP']);
    cy.checkRecordField('Dscp', 'DSCP', ['Standard']);

    cy.get('[data-test-id="group-6"]').contains("ICMP");
    cy.checkRecordField('IcmpType', 'Type', ['ICMP_DEST_UNREACH']);
    cy.checkRecordField('IcmpCode', 'Code', ['ICMP_NET_UNREACH']);

    cy.checkRecordField('FlowDirection', 'Node Direction', ['Egress']);
    cy.checkRecordField('FlowDirInts', 'Interfaces and Directions', ['br-ex', 'test', 'Egress', 'Ingress']);

    cy.checkRecordField('Bytes', 'Bytes', ['66 bytes sent']);
    cy.checkRecordField('Packets', 'Packets', ['1 packets sent']);
  });

  it('display pktDrop', () => {
    // select third row
    cy.get('#netflow-table-row-2').click();

    // check for drop bytes and packets
    cy.checkRecordField('Bytes', 'Bytes', ['32 bytes dropped']);
    cy.checkRecordField('Packets', 'Packets', ['1 packets dropped', 'SKB_DROP_REASON_TCP_INVALID_SEQUENCE']);
  });

  it('display dnsTracking', () => {
    // select 19th row
    cy.get('#netflow-table-row-19').click();

    // check for id, latency and errors
    cy.checkRecordField('DNSId', 'Id', ['48706']);
    cy.checkRecordField('DNSLatency', 'Latency', ['< 1ms']);
    cy.checkRecordField('DNSResponseCode', 'Response Code', ['No Error']);
    cy.checkRecordField('DNSErrNo', 'Error', ['0']);
  });

  it('display flowRTT', () => {
    // select second row
    cy.get('#netflow-table-row-2').click();

    // check for rtt
    cy.checkRecordField('TimeFlowRttMs', 'Flow RTT', ['4.05ms']);
  });

  it('display multiCluster', () => {
    // select 9th row
    cy.get('#netflow-table-row-9').click();

    // check for cluster name
    cy.checkRecordField('ClusterName', 'Cluster', ['test-cluster']);
  });

  it('display zones', () => {
    // select second row
    cy.get('#netflow-table-row-2').click();

    // check for source zone
    cy.checkRecordField('SrcZone', 'Zone', ['eu-west-1']);

    // check for destination zone
    cy.checkRecordField('DstZone', 'Zone', ['us-east-2']);
  });

  it('display networkEvents', () => {
    // select third row
    cy.get('#netflow-table-row-3').click();

    // check for source zone
    cy.checkRecordField('NetworkEvents', 'Network Events', ['Allowed by default allow from local node policy, direction Ingress']);
  });
})
