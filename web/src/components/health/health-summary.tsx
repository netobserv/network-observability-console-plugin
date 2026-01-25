import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, Card, CardBody, Flex, FlexItem, Grid, GridItem, Text, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HealthStats } from './health-helper';

export interface HealthSummaryProps {
  rules: Rule[];
  stats?: HealthStats;
}

export const HealthSummary: React.FC<HealthSummaryProps> = ({ rules, stats }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  // Count recording rules by severity
  let recordingRulesCritical = 0;
  let recordingRulesWarning = 0;
  let recordingRulesInfo = 0;

  if (stats) {
    // Count from global
    recordingRulesCritical += stats.recordingRules.global.critical.length;
    recordingRulesWarning += stats.recordingRules.global.warning.length;
    recordingRulesInfo += stats.recordingRules.global.other.length;

    // Count from all namespaces
    stats.recordingRules.byNamespace.forEach(ns => {
      recordingRulesCritical += ns.critical.length;
      recordingRulesWarning += ns.warning.length;
      recordingRulesInfo += ns.other.length;
    });

    // Count from all nodes
    stats.recordingRules.byNode.forEach(node => {
      recordingRulesCritical += node.critical.length;
      recordingRulesWarning += node.warning.length;
      recordingRulesInfo += node.other.length;
    });
  }

  // Check if there are no rules at all (neither alerts nor recording rules)
  const totalRecordingRules = recordingRulesCritical + recordingRulesWarning + recordingRulesInfo;
  if (rules.length === 0 && totalRecordingRules === 0) {
    return (
      <div className="health-summary-dashboard">
        <Alert title={t('No rules found, health cannot be determined')} variant="info">
          <>
            {t(
              'Check alert definitions in FlowCollector "spec.processor.metrics.alertGroups" and "spec.processor.metrics.disableAlerts".'
            )}
            <br />
            {t('Make sure that Prometheus and AlertManager are running.')}
          </>
        </Alert>
      </div>
    );
  }

  const summaryStats = {
    critical: {
      firingAlerts: rules.flatMap(r => r.alerts).filter(a => a.state === 'firing' && a.labels.severity === 'critical')
        .length,
      firingRules: rules.filter(a => a.state === 'firing' && a.labels.severity === 'critical').length,
      pendingAlerts: rules.flatMap(r => r.alerts).filter(a => a.state === 'pending' && a.labels.severity === 'critical')
        .length,
      pendingRules: rules.filter(a => a.state === 'pending' && a.labels.severity === 'critical').length,
      recordingRules: recordingRulesCritical,
      total: rules.filter(a => a.labels.severity === 'critical').length
    },
    warning: {
      firingAlerts: rules.flatMap(r => r.alerts).filter(a => a.state === 'firing' && a.labels.severity === 'warning')
        .length,
      firingRules: rules.filter(a => a.state === 'firing' && a.labels.severity === 'warning').length,
      pendingAlerts: rules.flatMap(r => r.alerts).filter(a => a.state === 'pending' && a.labels.severity === 'warning')
        .length,
      pendingRules: rules.filter(a => a.state === 'pending' && a.labels.severity === 'warning').length,
      recordingRules: recordingRulesWarning,
      total: rules.filter(a => a.labels.severity === 'warning').length
    },
    info: {
      firingAlerts: rules.flatMap(r => r.alerts).filter(a => a.state === 'firing' && a.labels.severity === 'info')
        .length,
      firingRules: rules.filter(a => a.state === 'firing' && a.labels.severity === 'info').length,
      pendingAlerts: rules.flatMap(r => r.alerts).filter(a => a.state === 'pending' && a.labels.severity === 'info')
        .length,
      pendingRules: rules.filter(a => a.state === 'pending' && a.labels.severity === 'info').length,
      recordingRules: recordingRulesInfo,
      total: rules.filter(a => a.labels.severity === 'info').length
    }
  };

  let title = t('The network looks healthy');
  let statusClass = 'success';
  if (summaryStats.critical.firingAlerts > 0 || summaryStats.critical.recordingRules > 0) {
    statusClass = 'critical';
    title = t('There are critical network issues');
  } else if (summaryStats.warning.firingAlerts > 0 || summaryStats.warning.recordingRules > 0) {
    statusClass = 'warning';
    title = t('There are network warnings');
  } else if (summaryStats.info.firingAlerts > 0 || summaryStats.info.recordingRules > 0) {
    statusClass = 'info';
    title = t('The network looks relatively healthy, with minor issues');
  }

  const criticalTotal = summaryStats.critical.firingAlerts + summaryStats.critical.recordingRules;
  const warningTotal = summaryStats.warning.firingAlerts + summaryStats.warning.recordingRules;
  const infoTotal = summaryStats.info.firingAlerts + summaryStats.info.recordingRules;

  return (
    <div className="health-summary-dashboard">
      <Grid hasGutter>
        {/* Status card */}
        <GridItem lg={3} md={6} sm={12}>
          <Card className={`health-metric-card status ${statusClass}`}>
            <CardBody>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
                <FlexItem>
                  <Text component={TextVariants.small} className="metric-label">
                    {t('Status')}
                  </Text>
                </FlexItem>
                <FlexItem>
                  <Text component={TextVariants.p} className="metric-status">
                    {title}
                  </Text>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </GridItem>

        {/* Critical card */}
        <GridItem lg={3} md={6} sm={12}>
          <Card className="health-metric-card critical">
            <CardBody>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
                <FlexItem>
                  <Text component={TextVariants.small} className="metric-label">
                    {t('Critical')}
                  </Text>
                </FlexItem>
                <FlexItem>
                  <Text component={TextVariants.h1} className="metric-value">
                    {criticalTotal}
                  </Text>
                </FlexItem>
                {criticalTotal > 0 && (
                  <FlexItem>
                    <Text component={TextVariants.small} className="metric-detail">
                      {summaryStats.critical.firingAlerts > 0 &&
                        t('{{count}} alerts', { count: summaryStats.critical.firingAlerts })}
                      {summaryStats.critical.firingAlerts > 0 && summaryStats.critical.recordingRules > 0 && ', '}
                      {summaryStats.critical.recordingRules > 0 &&
                        t('{{count}} recording', { count: summaryStats.critical.recordingRules })}
                    </Text>
                  </FlexItem>
                )}
              </Flex>
            </CardBody>
          </Card>
        </GridItem>

        {/* Warning card */}
        <GridItem lg={3} md={6} sm={12}>
          <Card className="health-metric-card warning">
            <CardBody>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
                <FlexItem>
                  <Text component={TextVariants.small} className="metric-label">
                    {t('Warning')}
                  </Text>
                </FlexItem>
                <FlexItem>
                  <Text component={TextVariants.h1} className="metric-value">
                    {warningTotal}
                  </Text>
                </FlexItem>
                {warningTotal > 0 && (
                  <FlexItem>
                    <Text component={TextVariants.small} className="metric-detail">
                      {summaryStats.warning.firingAlerts > 0 &&
                        t('{{count}} alerts', { count: summaryStats.warning.firingAlerts })}
                      {summaryStats.warning.firingAlerts > 0 && summaryStats.warning.recordingRules > 0 && ', '}
                      {summaryStats.warning.recordingRules > 0 &&
                        t('{{count}} recording', { count: summaryStats.warning.recordingRules })}
                    </Text>
                  </FlexItem>
                )}
              </Flex>
            </CardBody>
          </Card>
        </GridItem>

        {/* Info card */}
        <GridItem lg={3} md={6} sm={12}>
          <Card className="health-metric-card info">
            <CardBody>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
                <FlexItem>
                  <Text component={TextVariants.small} className="metric-label">
                    {t('Info')}
                  </Text>
                </FlexItem>
                <FlexItem>
                  <Text component={TextVariants.h1} className="metric-value">
                    {infoTotal}
                  </Text>
                </FlexItem>
                {infoTotal > 0 && (
                  <FlexItem>
                    <Text component={TextVariants.small} className="metric-detail">
                      {summaryStats.info.firingAlerts > 0 &&
                        t('{{count}} alerts', { count: summaryStats.info.firingAlerts })}
                      {summaryStats.info.firingAlerts > 0 && summaryStats.info.recordingRules > 0 && ', '}
                      {summaryStats.info.recordingRules > 0 &&
                        t('{{count}} recording', { count: summaryStats.info.recordingRules })}
                    </Text>
                  </FlexItem>
                )}
              </Flex>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </div>
  );
};
