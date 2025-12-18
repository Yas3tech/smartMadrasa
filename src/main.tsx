import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n'; // Initialize i18n
import App from './App.tsx';
import './services/seedDatabase'; // Expose seedDatabase to console

// Initialize theme from localStorage BEFORE React renders
// This prevents flash of wrong theme
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
        // Auto - check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  } catch (e) {
    console.error('Error initializing theme:', e);
  }
};

// Run theme initialization immediately
initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
