import { Tab, Tabs, Text, TextContent, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RecordingRulesStats } from './health-helper';
import { RecordingRulesGrid } from './recording-rules-grid';

export interface RecordingRulesListProps {
  stats: RecordingRulesStats;
  isDark: boolean;
}

export const RecordingRulesList: React.FC<RecordingRulesListProps> = ({ stats, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [activeTabKey, setActiveTabKey] = React.useState<string>('global');

  const totalRules = stats.global.length +
    stats.byNamespace.reduce((sum, ns) => sum + ns.rules.length, 0) +
    stats.byNode.reduce((sum, node) => sum + node.rules.length, 0);

  if (totalRules === 0) {
    return (
      <TextContent style={{ marginTop: '1rem' }}>
        <Text component={TextVariants.p}>{t('No recording rules configured')}</Text>
      </TextContent>
    );
  }

  return (
    <Tabs
      activeKey={activeTabKey}
      onSelect={(_, tabIndex) => setActiveTabKey(String(tabIndex))}
      role="region"
      className={isDark ? 'dark' : ''}
      style={{ marginTop: '1rem' }}
    >
      <Tab
        eventKey={'global'}
        title={t('Global')}
        aria-label="Tab recording global"
      >
        <RecordingRulesGrid rules={stats.global} />
      </Tab>
        <Tab
          eventKey={'per-node'}
          title={t('Nodes')}
          aria-label="Tab recording per node"
        >
          <RecordingRulesGrid rules={stats.byNode.flatMap(g => g.rules)} />
        </Tab>
        <Tab
          eventKey={'per-namespace'}
          title={t('Namespaces')}
          aria-label="Tab recording per namespace"
        >
          <RecordingRulesGrid rules={stats.byNamespace.flatMap(g => g.rules)} />
        </Tab>
    </Tabs>
  );
};

export default RecordingRulesList;
