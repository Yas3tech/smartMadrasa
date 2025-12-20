import { useState } from 'react';
import { Card, Button } from '../../components/UI';
import { Database, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import {
  clearAllData,
  seedSystemBasics,
} from '../../services/initFirebase';

const DatabaseAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleResetClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmReset = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setMessage(null);

    try {
      await seedSystemBasics();
      setMessage({
        type: 'success',
        text: '✅ Base de données initialisée avec succès !',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Erreur: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('⚠️ Ceci va supprimer TOUTES les données. Continuer ?')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await clearAllData();
      setMessage({
        type: 'success',
        text: '✅ Toutes les données ont été supprimées.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Erreur: ${error}`,
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
            Administration Base de Données
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gérer les données de la plateforme</p>
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
              🔄 Initialiser les Paramètres
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Configure les périodes académiques et les catégories de notes par défaut.
            </p>
            <Button
              onClick={handleResetClick}
              disabled={loading}
              icon={RefreshCw}
              className="bg-gradient-to-r from-orange-500 to-orange-600"
            >
              {loading ? 'Initialisation...' : 'Initialiser'}
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🗑️ Supprimer Toutes les Données
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Supprime toutes les collections Firestore. ⚠️ Action irréversible !
            </p>
            <Button
              onClick={handleClear}
              disabled={loading}
              icon={Trash2}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? 'Suppression...' : 'Supprimer Tout'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 text-orange-600 mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirmation Requise
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir initialiser la base de données ?
              <br />
              <br />
              ⚠️ Les paramètres par défaut seront recréés.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleConfirmReset}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Oui, Initialiser
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseAdmin;
