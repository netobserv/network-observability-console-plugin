import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core';
import React from 'react';
import './modal.css';

export interface CustomModalProps {
  title: string;
  description?: JSX.Element;
  footer?: JSX.Element;
  onClose?: () => void;
  isOpen: boolean;
  scrollable: boolean;
  id?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  id,
  scrollable,
  isOpen,
  onClose,
  title,
  description,
  children,
  footer
}) => {
  return (
    <Modal variant={ModalVariant.small} isOpen={isOpen} onClose={onClose} onEscapePress={onClose}>
      <ModalHeader title={title} description={description} data-test={`${id}-header`} />
      {children && (
        <ModalBody
          data-test={`${id}-body`}
          className={`${'modal-body'} ${scrollable ? 'scrollable' : 'overflow-visible'}`}
          tabIndex={scrollable ? 0 : undefined}
        >
          {children}
        </ModalBody>
      )}
      {footer && (
        <ModalFooter data-test={`${id}-footer`} className="modal-footer">
          {footer}
        </ModalFooter>
      )}
    </Modal>
  );
};

export default CustomModal;
