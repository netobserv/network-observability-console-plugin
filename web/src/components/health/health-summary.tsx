import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertVariant } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HealthStats } from './health-helper';

export interface HealthSummaryProps {
  rules: Rule[];
  stats?: HealthStats;
}

export const HealthSummary: React.FC<HealthSummaryProps> = ({ rules, stats }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  if (rules.length === 0) {
    return (
      <Alert title={t('No rules found, health cannot be determined')} className="health-summary-alert">
        <>
          {t(
            'Check alert definitions in FlowCollector "spec.processor.metrics.alertGroups" and "spec.processor.metrics.disableAlerts".'
          )}
          <br />
          {t('Make sure that Prometheus and AlertManager are running.')}
        </>
      </Alert>
    );
  }

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

  let variant: AlertVariant = AlertVariant.success;
  let title = t('The network looks healthy');
  if (summaryStats.critical.firingAlerts > 0 || summaryStats.critical.recordingRules > 0) {
    variant = AlertVariant.danger;
    title = t('There are critical network issues');
  } else if (summaryStats.warning.firingAlerts > 0 || summaryStats.warning.recordingRules > 0) {
    variant = AlertVariant.warning;
    title = t('There are network warnings');
  } else if (summaryStats.info.firingAlerts > 0 || summaryStats.info.recordingRules > 0) {
    title = t('The network looks relatively healthy, with minor issues');
  }

  const details: string[] = [];

  // Critical
  if (summaryStats.critical.firingAlerts > 0 || summaryStats.critical.recordingRules > 0) {
    const total = summaryStats.critical.firingAlerts + summaryStats.critical.recordingRules;
    const parts = [];
    if (summaryStats.critical.firingAlerts > 0) {
      parts.push(t('{{count}} from alerts', { count: summaryStats.critical.firingAlerts }));
    }
    if (summaryStats.critical.recordingRules > 0) {
      parts.push(t('{{count}} from recording rules', { count: summaryStats.critical.recordingRules }));
    }
    details.push(t('{{total}} critical issues ({{breakdown}})', { total, breakdown: parts.join(', ') }));
  } else if (summaryStats.critical.pendingAlerts > 0) {
    details.push(
      t('{{pendingAlerts}} pending critical issues, from {{pendingRules}} distinct rules', summaryStats.critical)
    );
  } else if (variant === AlertVariant.success) {
    details.push(t('No critical issues out of {{total}} rules', summaryStats.critical));
  }

  // Warning
  if (summaryStats.warning.firingAlerts > 0 || summaryStats.warning.recordingRules > 0) {
    const total = summaryStats.warning.firingAlerts + summaryStats.warning.recordingRules;
    const parts = [];
    if (summaryStats.warning.firingAlerts > 0) {
      parts.push(t('{{count}} from alerts', { count: summaryStats.warning.firingAlerts }));
    }
    if (summaryStats.warning.recordingRules > 0) {
      parts.push(t('{{count}} from recording rules', { count: summaryStats.warning.recordingRules }));
    }
    details.push(t('{{total}} warnings ({{breakdown}})', { total, breakdown: parts.join(', ') }));
  } else if (summaryStats.warning.pendingAlerts > 0) {
    details.push(
      t('{{pendingAlerts}} pending warnings, from {{pendingRules}} distinct rules', summaryStats.warning)
    );
  } else if (variant === AlertVariant.success) {
    details.push(t('No warnings out of {{total}} rules', summaryStats.warning));
  }

  // Info
  if (summaryStats.info.firingAlerts > 0 || summaryStats.info.recordingRules > 0) {
    const total = summaryStats.info.firingAlerts + summaryStats.info.recordingRules;
    const parts = [];
    if (summaryStats.info.firingAlerts > 0) {
      parts.push(t('{{count}} from alerts', { count: summaryStats.info.firingAlerts }));
    }
    if (summaryStats.info.recordingRules > 0) {
      parts.push(t('{{count}} from recording rules', { count: summaryStats.info.recordingRules }));
    }
    details.push(t('{{total}} minor issues ({{breakdown}})', { total, breakdown: parts.join(', ') }));
  } else if (summaryStats.info.pendingAlerts > 0) {
    details.push(t('{{pendingAlerts}} pending minor issues, from {{pendingRules}} distinct rules', summaryStats.info));
  } else if (variant === AlertVariant.success) {
    details.push(t('No minor issues out of {{total}} rules', summaryStats.info));
  }
  return (
    <Alert variant={variant} title={title} className="health-summary-alert">
      <ul>
        {details.map((text, i) => (
          <li key={'li_' + i}>{text}</li>
        ))}
      </ul>
    </Alert>
  );
};
