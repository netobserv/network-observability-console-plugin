import { Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant, Spinner, Title } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const NetflowTopology: React.FC<{
  loading?: boolean;
  error?: string;
}> = ({ error, loading }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  if (error) {
    return (
      <EmptyState data-test="error-state" variant={EmptyStateVariant.small}>
        <Title headingLevel="h2" size="lg">
          {t('Unable to get topology')}
        </Title>
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  } else if (loading) {
    return (
      <Bullseye data-test="loading-contents">
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  return <div>{t('TODO')}</div>;
};

export default NetflowTopology;
