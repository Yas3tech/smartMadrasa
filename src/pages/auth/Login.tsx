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
import { LogIn, AlertCircle, ArrowLeft, Send, Sparkles } from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isDatabaseEmpty, setIsDatabaseEmpty] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Check setup status after initial paint using dynamic import to save bundle size
    const checkSetup = async () => {
      try {
        const { checkIfDatabaseEmpty: check } = await import('../../services/setup');
        const isEmpty = await check();
        setIsDatabaseEmpty(isEmpty);
      } catch (e) {
        // Silently fail if firestore is blocked or fails to load
      }
    };
    checkSetup();
  }, []);

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
      // We don't set loading(false) here because if it succeeds, 
      // the useEffect will navigate away.
      // However, if the profile lookup fails, we'll be stuck.
      // Let's add a timeout or check authLoading in the UI.
    } catch (err) {
      const authError = err as AuthError;
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
      setError(t('auth.errors.googleLoginFailed', 'Échec de la connexion avec Google.'));
      setLoading(false);
    }
  };

  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full py-8">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="SmartMadrassa Logo"
            width="96"
            height="96"
            fetchPriority="high"
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-900">SmartMadrassa</h1>
          <p className="text-gray-500 mt-2">
            {isResetMode
              ? t('auth.resetPasswordTitle')
              : t('auth.signInToContinue')}
          </p>
        </div>

        <Card className="p-8 shadow-xl border-0 min-h-[500px] flex flex-col justify-center">
          <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-6">
            {/* Reserve space for errors and messages to avoid shift */}
            {(error || message) && (
              <div className="animate-in fade-in duration-300">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm mb-4">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {message && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-700 text-sm mb-4">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <p>{message}</p>
                  </div>
                )}
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
                className="text-sm text-orange-700 hover:text-orange-800 font-medium flex items-center justify-center gap-2 mx-auto"
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

            {/* First Run Prompt moved to bottom for stability */}
            {isDatabaseEmpty && !isResetMode && !error && !message && (
              <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-500">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-3 text-orange-800 font-semibold">
                    <Sparkles size={18} className="text-orange-500" />
                    <span className="text-sm">{t('auth.firstRunTitle', 'Première utilisation ?')}</span>
                  </div>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    {t('auth.firstRunDesc', "Aucune école n'est configurée. Commencez par créer votre compte administrateur.")}
                  </p>
                  <Button
                    onClick={() => navigate('/setup')}
                    variant="secondary"
                    size="sm"
                    className="w-full py-2 bg-white text-orange-600 border-orange-200 hover:bg-orange-50 shadow-none text-xs"
                  >
                    {t('auth.setupSchool', "Configurer l'école")}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{t('common.copyright')}</p>
        </div>
      </div>
    </main>
  );
};

export default Login;
