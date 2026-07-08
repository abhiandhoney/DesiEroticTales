import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryCore extends Component<Props & { pathname: string }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props & { pathname: string }) {
    if (this.state.hasError && prevProps.pathname !== this.props.pathname) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page error-page">
          <h2>Something went wrong</h2>
          <p className="page-subtitle">Please refresh the page or return home.</p>
          <div className="auth-required-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
              Refresh
            </button>
            <Link to="/" className="btn btn-ghost">Back to home</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: Props) {
  const location = useLocation();
  return (
    <ErrorBoundaryCore pathname={location.pathname}>
      {children}
    </ErrorBoundaryCore>
  );
}