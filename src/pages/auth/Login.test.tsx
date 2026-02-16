import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    getAuth: vi.fn(() => ({})),
    sendPasswordResetEmail: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    onAuthStateChanged: vi.fn(() => vi.fn()),
  };
});

vi.mock('../../config/firebase', () => ({
  auth: {},
  isFirebaseConfigured: true,
  firebaseConfig: {},
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

vi.mock('../../services/setup', () => ({
  checkIfDatabaseEmpty: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: {
      language: 'fr',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { sendPasswordResetEmail } from 'firebase/auth';

describe('Login Component - Security Vulnerability Check', () => {
  it('prevents username enumeration by showing success message even if user not found', async () => {
    // Setup mock for sendPasswordResetEmail to simulate user not found
    (sendPasswordResetEmail as any).mockRejectedValue({
      code: 'auth/user-not-found',
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Switch to reset mode
    const forgotPasswordLink = screen.getByText('auth.forgotPassword');
    fireEvent.click(forgotPasswordLink);

    // Fill in email
    const emailInput = screen.getByPlaceholderText('exemple@ecole.com');
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });

    // Click submit
    const submitButton = screen.getByText('Envoyer le lien');
    fireEvent.click(submitButton);

    // Expect the SUCCESS message to appear, not the error
    await waitFor(() => {
      expect(screen.getByText('Un email de réinitialisation a été envoyé.')).toBeInTheDocument();
      // Ensure the error message is NOT present
      expect(screen.queryByText('Aucun utilisateur trouvé avec cet email.')).not.toBeInTheDocument();
    });
  });

  it('shows generic error for other errors', async () => {
    // Setup mock for sendPasswordResetEmail to simulate a generic error
    (sendPasswordResetEmail as any).mockRejectedValue({
      code: 'auth/network-request-failed',
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Switch to reset mode
    const forgotPasswordLink = screen.getByText('auth.forgotPassword');
    fireEvent.click(forgotPasswordLink);

    // Fill in email
    const emailInput = screen.getByPlaceholderText('exemple@ecole.com');
    fireEvent.change(emailInput, { target: { value: 'error@example.com' } });

    // Click submit
    const submitButton = screen.getByText('Envoyer le lien');
    fireEvent.click(submitButton);

    // Expect the generic error message
    await waitFor(() => {
      // Login.tsx uses: t('auth.errors.generic', 'Une erreur est survenue.')
      // Our mock returns defaultValue
      expect(screen.getByText('Une erreur est survenue.')).toBeInTheDocument();
    });
  });
});
