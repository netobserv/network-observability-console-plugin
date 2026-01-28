import { Card, CardBody, Flex, FlexItem, Text, TextVariants } from '@patternfly/react-core';
import * as React from 'react';

export type Severity = 'critical' | 'warning' | 'info';

export interface HealthMetricCardProps {
  severity: Severity;
  label: string;
  total: number;
  detail?: string;
}

export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({ severity, label, total, detail }) => {
  return (
    <Card className={`health-metric-card ${severity}`}>
      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
          <FlexItem>
            <Text component={TextVariants.small} className="metric-label">
              {label}
            </Text>
          </FlexItem>
          <FlexItem>
            <Text component={TextVariants.h1} className="metric-value">
              {total}
            </Text>
          </FlexItem>
          {total > 0 && detail && (
            <FlexItem>
              <Text component={TextVariants.small} className="metric-detail">
                {detail}
              </Text>
            </FlexItem>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};
