import { NamespaceBar } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, PageSection, Spinner } from '@patternfly/react-core';
import * as React from 'react';
import { getRole } from '../api/routes';
import { clearLocalStorage } from '../utils/local-storage-hook';
import { clearURLParams } from '../utils/url';
import AlertFetcher from './alerts/fetcher';
import DynamicLoader from './dynamic-loader/dynamic-loader';
import { NetflowTraffic, NetflowTrafficProps } from './netflow-traffic';

type Props = NetflowTrafficProps & {};

type State = {
  error?: Error;
  role?: string;
  namespace?: string;
};

// NetflowTrafficParent encapsulates <NetflowTraffic> in an error boundary
// cf https://reactjs.org/docs/error-boundaries.html
class NetflowTrafficParent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(err: Error) {
    return { error: err };
  }

  componentDidMount() {
    getRole()
      .then(role => {
        let namespace = this.state.namespace;
        if (role === 'dev') {
          namespace = window?.sessionStorage?.getItem('bridge/last-namespace-name') || 'default';
        }
        this.setState({ ...this.state, role, namespace });
      })
      .catch(error => {
        console.error(error);
        this.setState({ ...this.state, error });
      });
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Netobserv plugin error. This is likely a bug, this error should be caught closer to its source.');
    console.error('Error:', error, 'errorInfo:', errorInfo);
    this.setState({ ...this.state, error: error });
  }

  reset() {
    clearLocalStorage();
    clearURLParams();
  }

  render() {
    if (this.state.error) {
      return (
        <div data-test="error-message" style={{ padding: 10 }}>
          <h1>Unexpected error</h1>
          <p>{this.state.error.toString()}</p>
          <p>(check logs for more information)</p>
          &nbsp;
          <p>If the error persists, use the reset button below</p>
          <p>to clear the local storage and remove url parameters before reloading the page</p>
          <button onClick={() => this.reset()}>Reset</button>
        </div>
      );
    } else if (!this.state.role) {
      return (
        <PageSection id="pageSection">
          <Bullseye data-test="loading-role">
            <Spinner size="xl" />
          </Bullseye>
        </PageSection>
      );
    }
    return (
      <DynamicLoader>
        <AlertFetcher>
          {!this.props.forcedNamespace && this.state.role === 'dev' && (
            <NamespaceBar onNamespaceChange={ns => this.setState({ ...this.state, namespace: ns })} />
          )}
          <NetflowTraffic
            isTab={this.props.isTab}
            hideTitle={this.props.hideTitle}
            forcedFilters={this.props.isTab ? this.props.forcedFilters : null}
            forcedNamespace={this.props.forcedNamespace || this.state.namespace}
            parentConfig={this.props.parentConfig}
          />
        </AlertFetcher>
      </DynamicLoader>
    );
  }
}

export default NetflowTrafficParent;
