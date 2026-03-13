import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from '../../config/firebase';
import { db } from '../../config/db';
import { Button, Input, Card } from '../../components/UI';
import { UserPlus, Settings, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { seedSystemBasics } from '../../services/initFirebase';
import { checkIfDatabaseEmpty } from '../../services/setup';

const FirstRunSetup: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [seedData, setSeedData] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const copy = i18n.language.startsWith('nl')
    ? {
        subtitle: 'Initiële configuratiewizard',
        passwordsDoNotMatch: 'Wachtwoorden komen niet overeen.',
        authCreated: 'Authenticatieaccount succesvol aangemaakt',
        seedingData: 'Schoolinstellingen initialiseren...',
        seedSuccess: 'Instellingen succesvol geïnitialiseerd!',
        welcomeTitle: 'Welkom op uw platform',
        welcomeDescription:
          'We hebben gedetecteerd dat dit de eerste opstart is. Laten we uw beheerdersaccount configureren.',
        superadminNoticePrefix: 'Dit eerste account krijgt ',
        superadminNoticeSuffix: ', zodat de hele school kan worden geconfigureerd.',
        start: 'Configuratie starten',
        initialAdminTitle: 'Eerste beheerdersaccount',
        fullName: 'Volledige naam',
        workEmail: 'Zakelijk e-mailadres',
        preconfigureSchool: 'School vooraf configureren',
        preconfigureDescription: 'Initialiseert standaard schoolperiodes en cijfercategorieën.',
        creating: 'Aanmaken...',
        finish: 'Configuratie voltooien',
        completedTitle: 'Configuratie voltooid!',
        completedDescription: 'Uw superadmin-account is aangemaakt en het systeem is klaar.',
        accessSummary: 'Samenvatting van uw toegang:',
        keepCredentials: 'Bewaar uw inloggegevens zorgvuldig.',
        goToDashboard: 'Naar dashboard',
      }
    : i18n.language.startsWith('ar')
      ? {
          subtitle: 'معالج الاعداد الاولي',
          passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين.',
          authCreated: 'تم انشاء حساب المصادقة بنجاح',
          seedingData: 'جار تهيئة اعدادات المدرسة...',
          seedSuccess: 'تمت تهيئة الاعدادات بنجاح!',
          welcomeTitle: 'مرحبا بك في منصتك',
          welcomeDescription: 'لقد اكتشفنا ان هذا اول تشغيل. لنبدأ باعداد حساب المدير.',
          superadminNoticePrefix: 'سيحصل هذا الحساب الاول على صلاحيات ',
          superadminNoticeSuffix: '، مما يسمح باعداد المدرسة كاملة.',
          start: 'ابدأ الاعداد',
          initialAdminTitle: 'حساب المدير الاول',
          fullName: 'الاسم الكامل',
          workEmail: 'البريد المهني',
          preconfigureSchool: 'اعداد المدرسة مسبقا',
          preconfigureDescription: 'يهيئ الفترات الدراسية وفئات الدرجات الافتراضية.',
          creating: 'جار الانشاء...',
          finish: 'انهاء الاعداد',
          completedTitle: 'اكتمل الاعداد!',
          completedDescription: 'تم انشاء حساب السوبر ادمن والنظام جاهز.',
          accessSummary: 'ملخص بيانات الدخول:',
          keepCredentials: 'يرجى الحفاظ على بيانات الدخول بعناية.',
          goToDashboard: 'الانتقال الى لوحة التحكم',
        }
      : {
          subtitle: 'Assistant de configuration initiale',
          passwordsDoNotMatch: 'Les mots de passe ne correspondent pas.',
          authCreated: 'Compte authentification cree avec succes',
          seedingData: 'Initialisation des parametres ecole...',
          seedSuccess: 'Parametres initialises avec succes !',
          welcomeTitle: 'Bienvenue sur votre plateforme',
          welcomeDescription:
            "Nous avons detecte qu'il s'agit du premier lancement. Commencons par configurer votre compte administrateur.",
          superadminNoticePrefix: 'Ce premier compte aura les droits ',
          superadminNoticeSuffix: ", lui permettant de parametrer l'ensemble de l'ecole.",
          start: 'Demarrer la configuration',
          initialAdminTitle: 'Compte Administrateur Initial',
          fullName: 'Nom complet',
          workEmail: 'Email professionnel',
          preconfigureSchool: "Pre-configurer l'ecole",
          preconfigureDescription:
            'Initialise les periodes scolaires et categories de notes par defaut.',
          creating: 'Creation en cours...',
          finish: 'Finaliser la configuration',
          completedTitle: 'Configuration Terminee !',
          completedDescription: 'Votre compte superadmin a ete cree et le systeme est pret.',
          accessSummary: 'Resume de vos acces :',
          keepCredentials: 'Veuillez conserver precieusement vos identifiants.',
          goToDashboard: 'Acceder au tableau de bord',
        };

  useEffect(() => {
    const verifyEmpty = async () => {
      try {
        const isEmpty = await checkIfDatabaseEmpty();
        if (!isEmpty) {
          navigate('/login', { replace: true });
          return;
        }
      } catch {
        navigate('/login', { replace: true });
        return;
      }
      setIsChecking(false);
    };
    verifyEmpty();
  }, [navigate]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    if (adminPassword !== confirmPassword) {
      toast.error(copy.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;

      await updateProfile(user, { displayName: adminName });
      toast.success(copy.authCreated);

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: adminName,
        email: adminEmail,
        role: 'superadmin',
        avatar: 'admin',
        createdAt: new Date().toISOString(),
      });

      await setDoc(doc(db, '_setup', 'config'), {
        setupCompletedAt: new Date().toISOString(),
        completedBy: user.uid,
        status: 'locked',
      });

      if (seedData) {
        toast.loading(copy.seedingData, { id: 'seed' });
        await seedSystemBasics();
        toast.success(copy.seedSuccess, { id: 'seed' });
      }

      setStep(3);
    } catch {
      toast.error(t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            SmartMadrassa
          </h1>
          <p className="text-lg text-gray-600">{copy.subtitle}</p>
        </div>

        <Card className="p-8 shadow-2xl border-0 overflow-hidden relative">
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 -z-10"></div>
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-orange-500 -translate-y-1/2 -z-10 transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle size={20} /> : s}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600">
                  <Settings size={40} className="animate-spin-slow" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{copy.welcomeTitle}</h2>
                <p className="text-gray-500 mt-2">{copy.welcomeDescription}</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
                <ShieldCheck className="flex-shrink-0" size={20} />
                <p>
                  {copy.superadminNoticePrefix} <strong>SuperAdmin</strong>
                  {copy.superadminNoticeSuffix}
                </p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => setStep(2)}
                  className="w-full py-4 text-lg font-bold bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg"
                  icon={ArrowRight}
                >
                  {copy.start}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form
              onSubmit={handleCreateAdmin}
              className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                <UserPlus className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900">{copy.initialAdminTitle}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={copy.fullName}
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="ex: Dr. Hassan El Fassi"
                />
                <Input
                  label={copy.workEmail}
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@ecole.com"
                />
                <Input
                  label={t('auth.password')}
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="********"
                />
                <Input
                  label={t('auth.confirmPassword')}
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seedData}
                    onChange={(e) => setSeedData(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-900">{copy.preconfigureSchool}</span>
                    <p className="text-xs text-gray-500">{copy.preconfigureDescription}</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3"
                  disabled={loading}
                >
                  {t('common.back')}
                </Button>
                <Button
                  type="submit"
                  className="flex-[2] py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? copy.creating : copy.finish}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
              <div className="relative">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
                  <CheckCircle size={48} />
                </div>
                <div className="absolute inset-0 animate-ping-slow rounded-full bg-green-200 opacity-20"></div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-gray-900">{copy.completedTitle}</h2>
                <p className="text-gray-500">{copy.completedDescription}</p>
              </div>

              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-orange-800">
                <p className="font-medium mb-1">{copy.accessSummary}</p>
                <p className="text-sm font-bold">{adminEmail}</p>
                <p className="text-xs mt-2 opacity-75">{copy.keepCredentials}</p>
              </div>

              <Button
                onClick={() => navigate('/')}
                className="w-full py-4 text-xl font-bold bg-gray-900 hover:bg-black transition-colors"
              >
                {copy.goToDashboard}
              </Button>
            </div>
          )}
        </Card>

        <p className="text-center text-gray-400 text-sm mt-8">{t('common.copyright')}</p>
      </div>
    </div>
  );
};

export default FirstRunSetup;
