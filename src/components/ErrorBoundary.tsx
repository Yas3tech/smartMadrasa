import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { reportClientError } from '../services/monitoring';

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
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

      const lang = this.props.i18n?.language || 'fr';
      const language = lang.startsWith('nl') ? 'nl' : lang.startsWith('ar') ? 'ar' : 'fr';
      const copy = {
        fr: {
          title: 'Une erreur est survenue',
          description:
            "L'application a rencontre un probleme inattendu. Veuillez recharger la page. Si le probleme persiste, contactez l'administrateur.",
          reload: 'Recharger la page',
        },
        nl: {
          title: 'Er is een fout opgetreden',
          description:
            'De applicatie heeft een onverwacht probleem ondervonden. Herlaad de pagina. Als het probleem blijft bestaan, neem contact op met de beheerder.',
          reload: 'Pagina herladen',
        },
        ar: {
          title: 'حدث خطأ',
          description:
            'واجه التطبيق مشكلة غير متوقعة. يرجى اعادة تحميل الصفحة. اذا استمرت المشكلة فتواصل مع المدير.',
          reload: 'اعادة تحميل الصفحة',
        },
      }[language];

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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>!</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              {copy.title}
            </h1>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {copy.description}
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
              {copy.reload}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const TranslatedErrorBoundary = withTranslation()(ErrorBoundary);
export default TranslatedErrorBoundary;
