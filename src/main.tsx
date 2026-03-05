import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';
import { reportClientError } from './services/monitoring';

const initializeTheme = () => {
  try {
    const savedSettings = localStorage.getItem('smartmadrassa_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const theme = settings?.display?.theme || 'light';

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  } catch {
    // Ignore malformed stored settings; defaults will be used
  }
};

initializeTheme();

window.addEventListener('error', (event) => {
  void reportClientError('error', event.error || event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  void reportClientError('unhandledrejection', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Type-safe access to the loading screen hideLoader injected by index.html
declare global {
  interface Window {
    hideLoader?: () => void;
  }
}
window.hideLoader?.();
