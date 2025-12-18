import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  type AuthError,
} from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/UI';
import { LogIn, AlertCircle, ArrowLeft, Send } from 'lucide-react'; // Added icons
import LanguageSwitcher from '../../components/LanguageSwitcher';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Success message
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false); // Reset mode toggler

  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase is not initialized');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const authError = err as AuthError;
      console.error('Login error:', authError);
      if (authError.code === 'auth/invalid-credential') {
        setError(t('auth.errors.invalidCredentials'));
      } else if (authError.code === 'auth/too-many-requests') {
        setError(t('auth.errors.tooManyRequests'));
      } else {
        setError(t('auth.errors.generic'));
      }
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (!email) {
      setError(t('auth.errors.emailRequired'));
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(t('auth.resetEmailSent', 'Un email de réinitialisation a été envoyé.'));
      setLoading(false);
    } catch (err) {
      const authError = err as AuthError;
      console.error('Reset error:', authError);
      if (authError.code === 'auth/user-not-found') {
        setError(t('auth.errors.userNotFound', 'Aucun utilisateur trouvé avec cet email.'));
      } else {
        setError(t('auth.errors.generic', 'Une erreur est survenue.'));
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    setError('');

    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const authError = err as AuthError;
      console.error('Google login error:', authError);
      setError(t('auth.errors.googleLoginFailed', 'Échec de la connexion avec Google.'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="SmartMadrassa Logo"
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-900">SmartMadrassa</h1>
          <p className="text-gray-500 mt-2">
            {isResetMode
              ? t('auth.resetPasswordTitle', 'Réinitialisation du mot de passe')
              : t('auth.signInToContinue')}
          </p>
        </div>

        <Card className="p-8 shadow-xl border-0">
          <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-700 text-sm">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p>{message}</p>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@ecole.com"
                required
              />

              {!isResetMode && (
                <Input
                  label={t('auth.password')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-200"
              disabled={loading}
              icon={isResetMode ? Send : LogIn}
            >
              {loading
                ? t('auth.loading')
                : isResetMode
                  ? t('auth.sendResetLink', 'Envoyer le lien')
                  : t('auth.login')}
            </Button>

            {!isResetMode && (
              <>
                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative bg-white px-4 text-sm text-gray-500">
                    {t('auth.or', 'OU')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span>{t('auth.continueWithGoogle', 'Continuer avec Google')}</span>
                </button>
              </>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(!isResetMode);
                  setError('');
                  setMessage('');
                }}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-2 mx-auto"
              >
                {isResetMode ? (
                  <>
                    <ArrowLeft size={16} />
                    {t('auth.backToLogin', 'Retour à la connexion')}
                  </>
                ) : (
                  t('auth.forgotPassword')
                )}
              </button>
            </div>
          </form>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{t('common.copyright')}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
