import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Modal } from '../../components/UI';
import {
  Database,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowRightCircle,
} from 'lucide-react';
import { clearAllData, seedSystemBasics } from '../../services/initFirebase';
import { advanceToNextAcademicYear } from '../../services/systemMaintenance';
import { useAcademics } from '../../context';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';

const translations = {
  fr: {
    title: 'Administration base de donnees',
    subtitle: 'Operations de maintenance systeme',
    seedTitle: 'Initialiser les donnees de base',
    seedDescription:
      "Cree les donnees academiques par defaut si elles n'existent pas encore.",
    seedAction: 'Initialiser',
    seeding: 'Initialisation...',
    seedSuccess: 'Donnees de base initialisees avec succes',
    advanceYearTitle: "Passer a l'annee suivante",
    advanceYearDescription:
      'Cree la nouvelle annee scolaire et efface les donnees annuelles.',
    advanceYearAction: "Passer a l'annee suivante",
    processing: 'Traitement...',
    advanceYearConfirmBody:
      'Cette action va creer la nouvelle annee scolaire et supprimer messages, devoirs, annonces, notifications et fichiers associes. Continuer ?',
    advanceYearConfirmAction: 'Confirmer et continuer',
    deleteAllTitle: 'Tout effacer',
    deleteAllDescription: 'Supprime toutes les donnees applicatives.',
    deleteAllAction: 'Tout effacer',
    deleting: 'Suppression...',
    deleteAllSuccess: 'Toutes les donnees ont ete supprimees',
    confirmDeleteAll: 'Voulez-vous vraiment supprimer toutes les donnees ?',
    confirmationTitle: 'Confirmation',
    seedConfirmBody:
      "Cette action va initialiser les donnees de base de l'application. Continuer ?",
    seedConfirmAction: 'Confirmer',
    advanceYearResult:
      "Année scolaire {{year}} créée. {{messages}} messages, {{homeworks}} devoirs, {{announcements}} annonces, {{notifications}} notifications et {{files}} fichiers storage supprimés.",
    tags: {
      deleted: "Supprimé :",
      messages: "Messages",
      homeworks: "Devoirs",
      announcements: "Annonces",
      notifications: "Notifications",
      events: "Événements",
      attendance: "Absences",
      courseGrades: "Notes",
      teacherComments: "Appréciations",
      files: "Fichiers joints",
      all: "Toute la base de données",
    },
  },
  nl: {
    title: 'Databasebeheer',
    subtitle: 'Systeemonderhoud',
    seedTitle: 'Basisgegevens initialiseren',
    seedDescription: 'Maakt standaard academische gegevens aan als ze nog niet bestaan.',
    seedAction: 'Initialiseren',
    seeding: 'Initialiseren...',
    seedSuccess: 'Basisgegevens succesvol geinitialiseerd',
    advanceYearTitle: 'Naar volgend schooljaar gaan',
    advanceYearDescription: 'Maakt het nieuwe schooljaar aan en wist jaarlijkse gegevens.',
    advanceYearAction: 'Naar volgend schooljaar',
    processing: 'Verwerken...',
    advanceYearConfirmBody:
      'Deze actie maakt een nieuw schooljaar aan en verwijdert berichten, huiswerken, aankondigingen, meldingen en gekoppelde bestanden. Doorgaan?',
    advanceYearConfirmAction: 'Bevestigen en doorgaan',
    deleteAllTitle: 'Alles wissen',
    deleteAllDescription: 'Verwijdert alle applicatiegegevens.',
    deleteAllAction: 'Alles wissen',
    deleting: 'Verwijderen...',
    deleteAllSuccess: 'Alle gegevens zijn verwijderd',
    confirmDeleteAll: 'Wilt u echt alle gegevens verwijderen?',
    confirmationTitle: 'Bevestiging',
    seedConfirmBody: 'Deze actie initialiseert de basisgegevens van de applicatie. Doorgaan?',
    seedConfirmAction: 'Bevestigen',
    advanceYearResult:
      'Schooljaar {{year}} aangemaakt. {{messages}} berichten, {{homeworks}} huiswerken, {{announcements}} aankondigingen, {{notifications}} meldingen en {{files}} opslagbestanden verwijderd.',
    tags: {
      deleted: "Verwijderd:",
      messages: "Berichten",
      homeworks: "Huiswerk",
      announcements: "Aankondigingen",
      notifications: "Meldingen",
      events: "Evenementen",
      attendance: "Aanwezigheid",
      courseGrades: "Cijfers",
      teacherComments: "Opmerkingen docent",
      files: "Bijlagen",
      all: "Gehele database",
    },
  },
  ar: {
    title: 'ادارة قاعدة البيانات',
    subtitle: 'عمليات صيانة النظام',
    seedTitle: 'تهيئة البيانات الاساسية',
    seedDescription: 'ينشئ البيانات الاكاديمية الافتراضية اذا لم تكن موجودة.',
    seedAction: 'تهيئة',
    seeding: 'جار التهيئة...',
    seedSuccess: 'تمت تهيئة البيانات الاساسية بنجاح',
    advanceYearTitle: 'الانتقال الى العام التالي',
    advanceYearDescription: 'ينشئ العام الدراسي الجديد ويمسح بيانات السنة.',
    advanceYearAction: 'الانتقال الى العام التالي',
    processing: 'جار المعالجة...',
    advanceYearConfirmBody:
      'سيتم انشاء عام دراسي جديد وحذف الرسائل والواجبات والاعلانات والاشعارات والملفات المرتبطة. هل تريد المتابعة؟',
    advanceYearConfirmAction: 'تأكيد والمتابعة',
    deleteAllTitle: 'مسح الكل',
    deleteAllDescription: 'يحذف جميع بيانات التطبيق.',
    deleteAllAction: 'مسح الكل',
    deleting: 'جار الحذف...',
    deleteAllSuccess: 'تم حذف جميع البيانات',
    confirmDeleteAll: 'هل تريد فعلا حذف جميع البيانات؟',
    confirmationTitle: 'تأكيد',
    seedConfirmBody: 'سيؤدي هذا الى تهيئة البيانات الاساسية للتطبيق. متابعة؟',
    seedConfirmAction: 'تأكيد',
    advanceYearResult:
      'تم انشاء العام الدراسي {{year}}. تم حذف {{messages}} رسائل و{{homeworks}} واجبات و{{announcements}} اعلانات و{{notifications}} اشعارات و{{files}} ملفات تخزين.',
    tags: {
      deleted: "سيتم حذف:",
      messages: "رسائل",
      homeworks: "واجبات",
      announcements: "إعلانات",
      notifications: "إشعارات",
      events: "أحداث",
      attendance: "غياب",
      courseGrades: "علامات",
      teacherComments: "ملاحظات المعلمين",
      files: "ملفات",
      all: "كل قاعدة البيانات",
    },
  },
} as const;

const interpolate = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''));

const DatabaseAdmin = () => {
  const { t, i18n } = useTranslation();
  const { academicPeriods } = useAcademics();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const copy = useMemo(() => {
    const lang = i18n.language.startsWith('nl')
      ? 'nl'
      : i18n.language.startsWith('ar')
        ? 'ar'
        : 'fr';
    return translations[lang];
  }, [i18n.language]);

  const handleConfirmSeed = async () => {
    setShowSeedModal(false);
    setLoading(true);
    setMessage(null);

    try {
      await seedSystemBasics();
      setMessage({ type: 'success', text: copy.seedSuccess });
    } catch (error) {
      setMessage({ type: 'error', text: `${t('common.error')}: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClear = async () => {
    setShowClearModal(false);
    setLoading(true);
    setMessage(null);

    try {
      await clearAllData();
      setMessage({ type: 'success', text: copy.deleteAllSuccess });

      // Force sign out the current user before reloading so they don't get auto-logged in 
      // by the cached Firebase valid token (the Cloud Function deletes it server-side, 
      // but the client-side token expires slowly).
      if (auth) {
        try {
          await auth.signOut();
        } catch {
          // Ignore sign out errors during full database reset
        }
      }

      // Force a hard page reload to clear Firebase JS SDK state and prevent INTERNAL ASSERTION crashes
      // caused by active listeners pointing to deleted documents.
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: `${t('common.error')}: ${error}` });
      setLoading(false);
    }
  };

  const handleAdvanceYear = async () => {
    setShowYearModal(false);
    setLoading(true);
    setMessage(null);

    try {
      const result = await advanceToNextAcademicYear(academicPeriods);
      setMessage({
        type: 'success',
        text: interpolate(copy.advanceYearResult, {
          year: result.nextAcademicYear,
          messages: result.deletedDocs.messages || 0,
          homeworks: result.deletedDocs.homeworks || 0,
          announcements: result.deletedDocs.announcements || 0,
          notifications: result.deletedDocs.notifications || 0,
          files: result.deletedStorageFiles,
        }),
      });
    } catch (error) {
      setMessage({ type: 'error', text: `${t('common.error')}: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('users.restrictedAccess')}</h2>
          <p className="text-gray-600">{t('users.restrictedAccessDesc')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
          <Database size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{copy.subtitle}</p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border-2 flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          )}
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}

      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {copy.seedTitle}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{copy.seedDescription}</p>
            <Button
              onClick={() => setShowSeedModal(true)}
              disabled={loading}
              icon={RefreshCw}
              className="bg-gradient-to-r from-orange-500 to-orange-600"
            >
              {loading ? copy.seeding : copy.seedAction}
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {copy.advanceYearTitle}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {copy.advanceYearDescription}
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 font-medium mr-1">{copy.tags.deleted}</span>
              {(['messages', 'homeworks', 'announcements', 'notifications', 'events', 'attendance', 'courseGrades', 'teacherComments', 'files'] as const).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-md border border-red-200 dark:border-red-800/50">
                  {copy.tags[tag]}
                </span>
              ))}
            </div>
            <Button
              onClick={() => setShowYearModal(true)}
              disabled={loading || academicPeriods.length === 0}
              icon={ArrowRightCircle}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {loading ? copy.processing : copy.advanceYearAction}
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {copy.deleteAllTitle}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {copy.deleteAllDescription}
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 font-medium mr-1">{copy.tags.deleted}</span>
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-md border border-red-200 dark:border-red-800/50">
                {copy.tags.all}
              </span>
            </div>
            <Button
              onClick={() => setShowClearModal(true)}
              disabled={loading}
              icon={Trash2}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? copy.deleting : copy.deleteAllAction}
            </Button>
          </div>
        </div>
      </Card>

      <Modal isOpen={showSeedModal} onClose={() => setShowSeedModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 text-orange-600 mb-4">
            <AlertCircle size={28} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {copy.confirmationTitle}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{copy.seedConfirmBody}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSeedModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirmSeed}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {copy.seedConfirmAction}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showYearModal} onClose={() => setShowYearModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <AlertCircle size={28} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {copy.confirmationTitle}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{copy.advanceYearConfirmBody}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowYearModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAdvanceYear}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {copy.advanceYearConfirmAction}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle size={28} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {copy.confirmationTitle}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{copy.confirmDeleteAll}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowClearModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirmClear}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {copy.deleteAllAction}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DatabaseAdmin;
