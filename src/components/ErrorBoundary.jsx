import React from 'react';
import './ErrorBoundary.css';
import { t } from '../utils/i18n';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You could also log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Optional: Log to analytics if available
    const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
    if (analytics?.trackEvent) {
      analytics.trackEvent('system_error', {
        message: error.message,
        stack: errorInfo.componentStack
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary-wrapper">
          <div className="error-boundary-content glass-card">
            <h1 className="error-title text-gradient">SYSTEM ERROR</h1>
            <p className="error-message">
              Ein unerwarteter Fehler ist aufgetreten. / An unexpected error occurred.
            </p>
            <div className="error-details">
              <code>{this.state.error?.message?.toString()}</code>
            </div>
            <button onClick={this.handleReload} className="btn btn-primary interactive mt-6">
              RELOAD SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
