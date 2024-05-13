import { EmptyState, EmptyStateBody, EmptyStateIcon, Text, TextVariants, Title } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';

type Props = {
  title: string;
  error: string;
};

export const PrometheusUnsupported: React.FC<Props> = ({ title, error }) => {
  return (
    <div id="prometheus-unsupported-container">
      <EmptyState data-test="prometheus-unsupported-state">
        <EmptyStateIcon icon={InfoAltIcon} />
        <Title headingLevel="h2" size="lg">
          {title}
        </Title>
        <EmptyStateBody>
          <Text component={TextVariants.p}>{error}</Text>
        </EmptyStateBody>
      </EmptyState>
    </div>
  );
};
