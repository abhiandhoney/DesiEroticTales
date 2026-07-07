import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
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
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
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