import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Text, TextContent, TextVariants } from '@patternfly/react-core';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../modals/modal';
import { SupportedKind } from './resource-watcher';

export type ResourceDeleteModalProps = {
  kind: SupportedKind;
  data: K8sResourceKind;
  onDelete: () => void;
  onCancel: () => void;
};

export const ResourceDeleteModal: FC<ResourceDeleteModalProps> = ({ kind, data, onDelete, onCancel }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let additionalInfo = '' as string | JSX.Element;
  switch (kind) {
    case 'FlowCollector':
      additionalInfo = t(
        'It will disable flow collection globally. All resources managed by the FlowCollector will be deleted, such as pods and services.'
      );
      break;
    case 'FlowMetric':
      additionalInfo = (
        <>
          {t('The following metric will stop being collected: ')}
          <strong className="co-break-word">{data.status?.prometheusName}</strong>
          <span>.</span>
        </>
      );
      break;
  }

  return (
    <Modal
      id="delete-modal"
      title={t('Delete {{kind}} {{name}}?', { kind: kind, name: data.metadata?.name })}
      isOpen={true}
      scrollable={false}
      onClose={onCancel}
      footer={
        <div className="footer">
          <Button
            id="cancel-delete-popup-button"
            data-test-id="cancel-delete-popup-button"
            key="cancel"
            variant="link"
            onClick={onCancel}
          >
            {t('Cancel')}
          </Button>
          <Button
            id="confirm-delete-popup-button"
            data-test-id="confirm-delete-popup-button"
            key="confirm"
            variant="danger"
            onClick={onDelete}
          >
            {t('Delete')}
          </Button>
        </div>
      }
    >
      <TextContent>
        <Text component={TextVariants.p}>
          {t('This action cannot be undone.')}
          <br />
          {additionalInfo}
        </Text>
      </TextContent>
    </Modal>
  );
};
