import { EmptyState, EmptyStateBody, EmptyStateIcon, Text, TextVariants, Title } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';

export interface HealthErrorProps {
  title: string;
  body: string;
}

export const HealthError: React.FC<HealthErrorProps> = ({ title, body }) => {
  return (
    <div id="netobserv-error-container">
      <EmptyState data-test="error-state">
        <EmptyStateIcon className="netobserv-error-icon" icon={ExclamationCircleIcon} />
        <Title headingLevel="h2" size="lg">
          {title}
        </Title>
        <EmptyStateBody className="error-body">
          <Text className="netobserv-error-message" component={TextVariants.p}>
            {body}
          </Text>
        </EmptyStateBody>
      </EmptyState>
    </div>
  );
};

export default HealthError;
