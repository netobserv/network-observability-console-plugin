import { Button, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { CloseIcon } from '@patternfly/react-icons';
import React from 'react';
import Modal from 'react-modal';
import './modal.css';

/* This Modal component replace patternfly one that has issues with overflows
 * it is based on console approach but their component is not exported in @openshift-console/dynamic-plugin-sdk
 * https://github.com/openshift/console/blob/master/frontend/public/components/factory/modal.tsx
 */
const CustomModal: React.FC<{
  title: string;
  description?: JSX.Element;
  footer?: JSX.Element;
  onClose?: () => void;
  isOpen: boolean;
  scrollable: boolean;
  id?: string;
}> = ({ id, scrollable, isOpen, onClose, title, description, children, footer }) => {
  return isOpen ? (
    <Modal
      id={id}
      isOpen={isOpen}
      className={'modal-dialog'}
      ariaHideApp={false}
      onRequestClose={() => (onClose ? onClose() : console.error('modal called onClose but is undefined'))}
      overlayClassName="co-overlay"
    >
      <div className="modal-content modal-content--no-inner-scroll">
        <div className="modal-header">
          <TextContent>
            <Text component={TextVariants.h1}>
              {title}
              {onClose && (
                <Button
                  className={'co-close-button co-close-button--float-right'}
                  onClick={e => {
                    e.stopPropagation();
                    onClose();
                  }}
                  variant="plain"
                >
                  <CloseIcon />
                </Button>
              )}
            </Text>
          </TextContent>
          {description && <div className="modal-description">{description}</div>}
        </div>
        {children && (
          <div className={`${'modal-body'} ${scrollable ? 'scrollable' : 'overflow-visible'}`}>{children}</div>
        )}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </Modal>
  ) : (
    <></>
  );
};

export default CustomModal;
