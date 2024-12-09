/// <reference types="cypress" />
import r from './../../../../mocks/loki/flow_records.json';

describe('netflow-table', () => {
  beforeEach(() => {
    // this test bench only work with mocks
    cy.intercept('GET', '/api/loki/flow/records?*', {
      statusCode: 200,
      body: r.data,
    });
    cy.openNetflowTrafficPage(true);

    //move to table view
    cy.get('.tableTabButton').click();
    //clear default app filters
    cy.get('#clear-all-filters-button').click();
  });

  it('display content correctly', () => {
    // select first row
    cy.get('#netflow-table-row-0').click()
    // check for side panel content

    // Dates
    //cy.checkRecordField('StartTime', 'Start Time', ['Feb 15, 2024', '4:44:27.121 PM']);
    //cy.checkRecordField('EndTime', 'End Time', ['Feb 15, 2024', '4:44:27.121 PM']);

    // Source accordion
    cy.get('[data-test-id="group-2"]').contains("Source");
    cy.checkRecordField('SrcK8S_Name', 'Name', ['N', 'ip-10-0-1-7.ec2.internal']);
    cy.checkRecordField('SrcK8S_Type', 'Kind', ['Node']);
    cy.checkRecordField('SrcAddr', 'IP', ['10.0.1.7']);
    cy.checkRecordField('SrcPort', 'Port', ['50104']);
    cy.checkRecordField('SrcMac', 'MAC', ['02:27:A1:A8:84:B9']);

    // Destination accordion
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
})
