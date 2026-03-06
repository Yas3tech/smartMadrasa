import { useState } from 'react';
import { Card, Button } from '../../components/UI';
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
import { useAcademics } from '../../context/DataContext';

const DatabaseAdmin = () => {
  const { academicPeriods } = useAcademics();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  const handleConfirmSeed = async () => {
    setShowSeedModal(false);
    setLoading(true);
    setMessage(null);

    try {
      await seedSystemBasics();
      setMessage({
        type: 'success',
        text: 'Base de donnees initialisee avec succes.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erreur: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Ceci va supprimer toutes les donnees Firestore. Continuer ?')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await clearAllData();
      setMessage({
        type: 'success',
        text: 'Toutes les donnees Firestore ont ete supprimees.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erreur: ${error}`,
      });
    } finally {
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
        text:
          `Annee ${result.nextAcademicYear} creee. ` +
          `${result.deletedDocs.messages || 0} messages, ` +
          `${result.deletedDocs.homeworks || 0} devoirs, ` +
          `${result.deletedDocs.announcements || 0} annonces, ` +
          `${result.deletedDocs.notifications || 0} notifications et ` +
          `${result.deletedStorageFiles} fichiers storage supprimes.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erreur: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
          <Database size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Administration base de donnees
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Outils de maintenance et de reinitialisation
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
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
              Initialiser les parametres
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Recree les periodes academiques et categories de notes par defaut.
            </p>
            <Button
              onClick={() => setShowSeedModal(true)}
              disabled={loading}
              icon={RefreshCw}
              className="bg-gradient-to-r from-orange-500 to-orange-600"
            >
              {loading ? 'Initialisation...' : 'Initialiser'}
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Passer a l annee suivante
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Cree les nouvelles periodes academiques puis nettoie les donnees annuelles:
              messages, devoirs, annonces, notifications, evenements, soumissions et fichiers
              storage geres par l application.
            </p>
            <Button
              onClick={() => setShowYearModal(true)}
              disabled={loading || academicPeriods.length === 0}
              icon={ArrowRightCircle}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {loading ? 'Traitement...' : 'Passer a l annee suivante'}
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Supprimer toutes les donnees
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Supprime toutes les collections Firestore. Action irreversible.
            </p>
            <Button
              onClick={handleClear}
              disabled={loading}
              icon={Trash2}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? 'Suppression...' : 'Supprimer tout'}
            </Button>
          </div>
        </div>
      </Card>

      {showSeedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 text-orange-600 mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirmation requise
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Les parametres par defaut seront recrees.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowSeedModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleConfirmSeed}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Oui, initialiser
              </Button>
            </div>
          </div>
        </div>
      )}

      {showYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirmation requise
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Cette action va creer l annee suivante et supprimer les donnees operationnelles de
              l annee en cours.
              <br />
              <br />
              Seront effaces: messages, devoirs, annonces, notifications, evenements, soumissions
              et fichiers storage geres par l application.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowYearModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAdvanceYear}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Oui, passer a l annee suivante
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseAdmin;
