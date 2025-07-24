import { ErrorBoundaryFallbackProps } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';

export type ErrorBoundaryProps = {
  fallbackComponent?: React.ComponentType<ErrorBoundaryFallbackProps>;
};

export type ErrorBoundaryState = {
  hasError: boolean;
  error: { message: string; stack: string; name: string };
  errorInfo: { componentStack: string };
};

const DefaultFallback: React.FC = () => <div />;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  readonly defaultState: ErrorBoundaryState = {
    hasError: false,
    error: {
      message: '',
      stack: '',
      name: ''
    },
    errorInfo: {
      componentStack: ''
    }
  };

  constructor(props: ErrorBoundaryProps | Readonly<ErrorBoundaryProps>) {
    super(props);
    this.state = this.defaultState;
  }

  componentDidCatch(error: never, errorInfo: never) {
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
    // Log the error so something shows up in the JS console when `DefaultFallback` is used.
    // eslint-disable-next-line no-console
    console.error('Caught error in a child component:', error, errorInfo);
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const FallbackComponent = this.props.fallbackComponent || DefaultFallback;
    return hasError ? (
      <FallbackComponent
        title={error.name}
        componentStack={errorInfo.componentStack}
        errorMessage={error.message}
        stack={error.stack}
      />
    ) : (
      <>{this.props.children}</>
    );
  }
}

export default ErrorBoundary;
