import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * ErrorBoundary Component
 * Catches any client-side JavaScript crashes and displays a clean error banner
 * instead of letting the browser display a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('EcoSathi Runtime Caught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #fecdd3',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>🌱</span>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#9f1239', margin: 0 }}>
                  EcoSathi Application Notice
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  A client-side render exception occurred.
                </p>
              </div>
            </div>

            <div style={{
              background: '#fff1f2',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #ffe4e6',
              marginBottom: '20px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#be123c', margin: 0 }}>
                {this.state.error?.message || this.state.error?.toString()}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Reset Session & Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);