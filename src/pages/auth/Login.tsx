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
import { auth, isUnsafeProductionConfig } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/UI';
import { LogIn, AlertCircle, ArrowLeft, Send, Sparkles } from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isDatabaseEmpty, setIsDatabaseEmpty] = useState(false);

  const lang = i18n?.language || 'fr';
  const copy = lang.startsWith('nl')
    ? {
      title: 'Log in om door te gaan',
      resetTitle: 'Wachtwoord opnieuw instellen',
      invalidCredentials: 'Ongeldig e-mailadres of wachtwoord',
      tooManyRequests: 'Te veel pogingen. Probeer het later opnieuw.',
      genericError: 'Er is een fout opgetreden bij het inloggen',
      emailRequired: 'Voer uw e-mailadres in.',
      resetEmailSent: 'Er is een e-mail voor wachtwoordherstel verzonden.',
      unauthorizedGoogleAccount:
        'Dit Google-account is niet toegestaan. Neem contact op met de administratie.',
      googleLoginFailed: 'Inloggen met Google mislukt.',
      sendResetLink: 'Link verzenden',
      or: 'OF',
      continueWithGoogle: 'Doorgaan met Google',
      backToLogin: 'Terug naar aanmelden',
      firstRunTitle: 'Eerste gebruik?',
      firstRunDesc: 'Er is nog geen school geconfigureerd. Maak eerst uw beheerdersaccount aan.',
      setupSchool: 'School configureren',
      firstLogin: 'Eerste aanmelding / Wachtwoord vergeten',
      resetEmailSentSuccess: 'Er is een e-mail voor wachtwoordherstel verzonden. Het kan tot 5 minuten duren voordat deze aankomt.',
    }
    : i18n.language.startsWith('ar')
      ? {
        title: 'قم بتسجيل الدخول للمتابعة',
        resetTitle: 'اعادة تعيين كلمة المرور',
        invalidCredentials: 'بريد الكتروني او كلمة مرور غير صحيحة',
        tooManyRequests: 'عدد كبير جدا من المحاولات. يرجى المحاولة لاحقا.',
        genericError: 'حدث خطأ اثناء تسجيل الدخول',
        emailRequired: 'يرجى ادخال بريدك الالكتروني.',
        resetEmailSent: 'تم ارسال رسالة اعادة تعيين كلمة المرور.',
        unauthorizedGoogleAccount: 'حساب Google هذا غير مصرح له. يرجى التواصل مع الادارة.',
        googleLoginFailed: 'فشل تسجيل الدخول باستخدام Google.',
        sendResetLink: 'ارسال الرابط',
        or: 'او',
        continueWithGoogle: 'المتابعة باستخدام Google',
        backToLogin: 'العودة الى تسجيل الدخول',
        firstRunTitle: 'اول استخدام؟',
        firstRunDesc: 'لم يتم اعداد اي مدرسة بعد. ابدأ بإنشاء حساب المدير.',
        setupSchool: 'اعداد المدرسة',
        firstLogin: 'تسجيل الدخول الأول / نسيت كلمة المرور',
        resetEmailSentSuccess: 'تم ارسال رسالة اعادة تعيين كلمة المرور. قد يستغرق وصولها حتى 5 دقائق.',
      }
      : {
        title: 'Connectez-vous pour continuer',
        resetTitle: 'Reinitialiser le mot de passe',
        invalidCredentials: 'Email ou mot de passe incorrect',
        tooManyRequests: 'Trop de tentatives. Reessayez plus tard.',
        genericError: "Une erreur s'est produite",
        emailRequired: 'Veuillez saisir votre email.',
        resetEmailSent: 'Un email de reinitialisation a ete envoye.',
        unauthorizedGoogleAccount:
          "Ce compte Google n'est pas autorise. Veuillez contacter l'administration.",
        googleLoginFailed: 'Echec de la connexion avec Google.',
        sendResetLink: 'Envoyer le lien',
        or: 'OU',
        continueWithGoogle: 'Continuer avec Google',
        backToLogin: 'Retour a la connexion',
        firstRunTitle: 'Premiere utilisation ?',
        firstRunDesc:
          "Aucune ecole n'est configuree. Commencez par creer votre compte administrateur.",
        setupSchool: "Configurer l'ecole",
        firstLogin: 'Première connexion / Mot de passe oublié',
        resetEmailSentSuccess: 'Un email de réinitialisation a été envoyé. Son arrivée dans votre boîte de réception peut prendre jusqu\'à 5 minutes.',
      };

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { checkIfDatabaseEmpty: check } = await import('../../services/setup');
        const isEmpty = await check();
        setIsDatabaseEmpty(isEmpty);
      } catch {
        // Ignore setup probe failures on login.
      }
    };
    checkSetup();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    } else if (!authLoading && loading && !isResetMode) {
      // If AuthContext finished loading but there's no user, 
      // the login failed (e.g., no Firestore doc or other mismatch)
      setLoading(false);
      setError(copy.invalidCredentials);
    }
  }, [user, authLoading, loading, isResetMode, navigate, copy.invalidCredentials]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnsafeProductionConfig || !auth) {
      setError(copy.genericError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const authError = err as AuthError;
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        setError(copy.invalidCredentials);
      } else if (authError.code === 'auth/too-many-requests') {
        setError(copy.tooManyRequests);
      } else {
        setError(copy.genericError);
      }
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (!email) {
      setError(copy.emailRequired);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(copy.resetEmailSentSuccess);
      setLoading(false);
    } catch (err) {
      const authError = err as AuthError;
      if (authError.code === 'auth/user-not-found') {
        setMessage(copy.resetEmailSentSuccess); // Prevent email sniffing
      } else {
        setError(copy.genericError);
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    setError('');

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../config/db');

      if (db) {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        let isAuthorized = userDoc.exists();

        if (!isAuthorized && result.user.email) {
          const { getUserByEmail } = await import('../../services/users');
          const userByEmail = await getUserByEmail(result.user.email);
          if (userByEmail) {
            isAuthorized = true;
          }
        }

        if (!isAuthorized) {
          await auth.signOut();
          setError(copy.unauthorizedGoogleAccount);
          setLoading(false);
          return;
        }
      }
    } catch {
      setError(copy.googleLoginFailed);
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
            {isResetMode ? copy.resetTitle : copy.title}
          </p>
        </div>

        <Card className="p-8 shadow-xl border-0 min-h-[500px] flex flex-col justify-center">
          <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-6">
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
                autoComplete="username"
              />

              {!isResetMode && (
                <Input
                  label={t('auth.password')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  autoComplete="current-password"
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
                  ? copy.sendResetLink
                  : t('auth.login')}
            </Button>

            {!isResetMode && (
              <>
                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative bg-white px-4 text-sm text-gray-500">{copy.or}</div>
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
                  <span>{copy.continueWithGoogle}</span>
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
                    {copy.backToLogin}
                  </>
                ) : (
                  copy.firstLogin
                )}
              </button>
            </div>

            {isDatabaseEmpty && !isResetMode && !error && !message && (
              <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-500">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-3 text-orange-800 font-semibold">
                    <Sparkles size={18} className="text-orange-500" />
                    <span className="text-sm">{copy.firstRunTitle}</span>
                  </div>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    {copy.firstRunDesc}
                  </p>
                  <Button
                    onClick={() => navigate('/setup')}
                    variant="secondary"
                    size="sm"
                    className="w-full py-2 bg-white text-orange-600 border-orange-200 hover:bg-orange-50 shadow-none text-xs"
                  >
                    {copy.setupSchool}
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
