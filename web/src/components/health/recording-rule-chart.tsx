import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import { Card, CardBody, CardTitle, GridItem, Label, Skeleton } from '@patternfly/react-core';
import axios from 'axios';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export interface RecordingRuleChartProps {
  rule: Rule;
}

interface PrometheusQueryResult {
  metric: { [key: string]: string };
  value: [number, string];
}

interface PrometheusResponse {
  data: {
    result: PrometheusQueryResult[];
  };
}

// Helper to get display name from rule
const getDisplayName = (rule: Rule): string => {
  // Prefer template label if available (for recording rules)
  if (rule.labels?.template) {
    return rule.labels.template;
  }
  // Fallback to rule name
  return rule.name || '';
};

export const RecordingRuleChart: React.FC<RecordingRuleChartProps> = ({ rule }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();
  const [value, setValue] = React.useState<string | undefined>();
  const [labels, setLabels] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    const fetchMetricValue = async () => {
      try {
        setLoading(true);
        setError(undefined);

        // Query Prometheus for the current value of this recording rule
        const response = await axios.get<PrometheusResponse>('/api/prometheus/api/v1/query', {
          params: {
            query: rule.name
          }
        });

        if (response.data.data.result.length > 0) {
          const result = response.data.data.result[0];
          setValue(result.value[1]);
          setLabels(result.metric);
        } else {
          setValue(undefined);
        }
      } catch (err) {
        console.error('Error fetching metric value:', err);
        setError(t('Failed to fetch metric value'));
      } finally {
        setLoading(false);
      }
    };

    fetchMetricValue();
  }, [rule.name, t]);

  const renderContent = () => {
    if (loading) {
      return <Skeleton height="100px" />;
    }

    if (error) {
      return <div style={{ color: 'var(--pf-global--danger-color--100)' }}>{error}</div>;
    }

    if (!value) {
      return null; // Don't render card if no data
    }

    // Parse and format the value
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return null; // Don't render card if value is 0 or invalid
    }

    const formattedValue = numValue.toFixed(2);

    return (
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pf-global--primary-color--100)' }}>
        {formattedValue}%
      </div>
    );
  };

  const content = renderContent();

  // Don't render card if there's no value or it's zero
  if (!loading && !error && content === null) {
    return null;
  }

  const namespace = labels['namespace'];
  const node = labels['node'];

  return (
    <GridItem sm={12} md={5} lg={3}>
      <Card isCompact>
        <CardTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{getDisplayName(rule)}</span>
            {namespace && <Label color="blue">{namespace}</Label>}
            {!namespace && node && <Label color="purple">{node}</Label>}
          </div>
        </CardTitle>
        <CardBody>{content}</CardBody>
      </Card>
    </GridItem>
  );
};

export default RecordingRuleChart;
