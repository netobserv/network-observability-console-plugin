import * as React from 'react';
import { clearLocalStorage } from '../utils/local-storage-hook';
import { clearURLParams } from '../utils/url';
import AlertFetcher from './alerts/fetcher';
import DynamicLoader from './dynamic-loader/dynamic-loader';
import { NetflowTraffic, NetflowTrafficProps } from './netflow-traffic';

type Props = NetflowTrafficProps & {};

type State = {
  error?: Error;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Netobserv plugin error. This is likely a bug, this error should be caught closer to its source.');
    console.error('Error:', error, 'errorInfo:', errorInfo);
    this.setState({ error: error });
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
    }
    return (
      <DynamicLoader>
        <AlertFetcher>
          <NetflowTraffic
            isTab={this.props.isTab}
            forcedFilters={this.props.isTab ? this.props.forcedFilters : null}
            parentConfig={this.props.parentConfig}
          />
        </AlertFetcher>
      </DynamicLoader>
    );
  }
}

export default NetflowTrafficParent;
