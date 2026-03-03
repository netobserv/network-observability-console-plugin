import { Alert, AlertActionCloseButton, AlertGroup } from '@patternfly/react-core';
import * as React from 'react';
import './error-banner.css';

export interface WarningBannerProps {
  warning: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ warning }) => {
  const [dismissed, setDismissed] = React.useState(false);

  // Reset dismissed state when warning changes
  React.useEffect(() => {
    if (warning) {
      setDismissed(false);
    }
  }, [warning]);

  if (dismissed || !warning) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="netobserv-error-banner">
      <AlertGroup isToast={false}>
        <Alert
          variant="warning"
          title={warning}
          actionClose={<AlertActionCloseButton onClose={handleDismiss} />}
          isInline
        />
      </AlertGroup>
    </div>
  );
};

export default WarningBanner;
