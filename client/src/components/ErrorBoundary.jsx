import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', background: '#FEF2F2', color: '#991B1B', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 'bold' }}>Application Error</h1>
          <p style={{ marginBottom: '20px', fontSize: '16px' }}>Please copy this error message and send it to your developer:</p>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #FCA5A5', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '10px', color: '#7F1D1D' }}>{this.state.error?.toString()}</h3>
            <pre style={{ fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo?.componentStack || this.state.error?.stack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
