import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Spinner,
  Title
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutName, TopologyOptions } from '../../model/topology';

const NetflowTopology: React.FC<{
  loading?: boolean;
  error?: string;
  layout?: LayoutName;
  options?: TopologyOptions;
  toggleTopologyOptions?: () => void;
}> = ({ error, loading, layout, options, toggleTopologyOptions }) => {
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

  return (
    <div>
      {t('TODO')}
      <Button variant="primary" onClick={toggleTopologyOptions}>
        {t('Show options')}
      </Button>
      {layout}
      {options && JSON.stringify(options)}
    </div>
  );
};

export default NetflowTopology;
