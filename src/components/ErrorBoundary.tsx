import { Component, type ReactNode, type ErrorInfo } from 'react';
import { reportClientError } from '../services/monitoring';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary — catches unhandled JS errors in the React tree
 * and displays a user-friendly fallback UI instead of a white screen.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Logged in dev — stripped in production by Terser (drop_console: true)
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
        void reportClientError('error', error, {
            componentStack: errorInfo.componentStack,
        });
    }

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        padding: '2rem',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        color: '#1a1a2e',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '480px',
                            padding: '2.5rem',
                            borderRadius: '16px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                            Une erreur est survenue
                        </h1>
                        <p style={{ color: '#6c757d', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            L'application a rencontré un problème inattendu. Veuillez recharger la page.
                            Si le problème persiste, contactez l'administrateur.
                        </p>
                        <button
                            onClick={this.handleReload}
                            style={{
                                padding: '0.75rem 2rem',
                                fontSize: '1rem',
                                fontWeight: 500,
                                color: '#ffffff',
                                backgroundColor: '#4f46e5',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) => {
                                (e.target as HTMLButtonElement).style.backgroundColor = '#4338ca';
                            }}
                            onMouseOut={(e) => {
                                (e.target as HTMLButtonElement).style.backgroundColor = '#4f46e5';
                            }}
                        >
                            Recharger la page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
