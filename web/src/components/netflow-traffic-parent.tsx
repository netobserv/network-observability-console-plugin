import * as React from 'react';
import NetflowTraffic from './netflow-traffic';

type Props = {};
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

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 10 }}>
          <h1>Unexpected error</h1>
          <p>{this.state.error.toString()}</p>
          <p>(check logs for more information)</p>
        </div>
      );
    }
    if (this.props.children) {
      return this.props.children;
    }
    // else render default NetworkTraffic
    return <NetflowTraffic />;
  }
}

export default NetflowTrafficParent;
