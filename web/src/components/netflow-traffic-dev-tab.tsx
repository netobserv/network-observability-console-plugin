import { Bullseye, PageSection, Spinner } from '@patternfly/react-core';
import * as React from 'react';
import NetflowTrafficParent from './netflow-traffic-parent';

interface NetflowTrafficDevTabProps {
  customData?: unknown;
  history?: unknown;
  location?: unknown;
  match?: {
    isExact?: boolean;
    params?: {
      ns?: string;
    };
    path?: string;
    url?: string;
  };
  obj?: unknown;
  params?: {
    ns?: string;
  };
  staticContext?: unknown;
}

export const NetflowTrafficDevTab: React.FC<NetflowTrafficDevTabProps> = props => {
  //default to 800 to allow content to be rendered in tests
  const [containerHeight, setContainerHeight] = React.useState(800);

  React.useEffect(() => {
    const container = document.getElementById('content-scrollable');
    if (container) {
      setContainerHeight(container.clientHeight);
    }
  }, []);

  const namespace = props.params?.ns || props.match?.params?.ns;
  if (!namespace) {
    return (
      <PageSection id="pageSection">
        <Bullseye data-test="loading-tab">
          <Spinner size="xl" />
        </Bullseye>
      </PageSection>
    );
  }
  return (
    <div className="netobserv-tab-container" style={{ height: containerHeight - 200 }}>
      <NetflowTrafficParent forcedFilters={null} isTab={true} parentConfig={undefined} forcedNamespace={namespace} />
    </div>
  );
};

export default NetflowTrafficDevTab;
