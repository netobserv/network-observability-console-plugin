import { PageSection, Title, Wizard, WizardStep } from '@patternfly/react-core';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

type WizardProps = {};

const NetflowWizard: FC<WizardProps> = props => {
  console.log(props);
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <PageSection id="pageSection">
      <Title headingLevel={'h1'}>{t('FlowCollector step by step configuration')}</Title>
      <Wizard>
        <WizardStep
          name={t('Capture')}
          id="capture-step"
          steps={[
            <WizardStep name={t('Filters')} id="filters-step" key="filters-step">
              Substep 1 A content
            </WizardStep>,
            <WizardStep name={t('Options')} id="options-step" key="options-step">
              Substep 1 B content
            </WizardStep>,
            <WizardStep name={t('Pipeline')} id="pipeline-step" key="pipeline-step">
              Substep 1 C content
            </WizardStep>
          ]}
        />
        <WizardStep
          name={t('Storage')}
          id="storage-step"
          steps={[
            <WizardStep name={t('Loki')} id="loki-step" key="loki-step">
              Substep 2 A content
            </WizardStep>,
            <WizardStep name={t('Prometheus')} id="prom-step" key="prom-step">
              Substep 2 B content
            </WizardStep>
          ]}
        />
        <WizardStep
          name={t('Exporters')}
          id="exporters-step"
          steps={[
            <WizardStep name={t('IPFIX')} id="ipfix-step" key="ipfix-step">
              Substep 3 A content
            </WizardStep>,
            <WizardStep name={t('Kafka')} id="kafka-step" key="kafka-step">
              Substep 3 B content
            </WizardStep>,
            <WizardStep name={t('Open Telemetry')} id="otel-step" key="otel-step">
              Substep 3 C content
            </WizardStep>
          ]}
        />
        <WizardStep name={t('Review')} id="review-step" footer={{ nextButtonText: 'Finish' }}>
          Review content
        </WizardStep>
      </Wizard>
    </PageSection>
  );
};

export default NetflowWizard;
