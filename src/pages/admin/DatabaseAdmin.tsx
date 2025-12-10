import { useState } from 'react';
import { Card, Button } from '../../components/UI';
import { Database, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { resetFirebaseData, clearAllData, initializeFirebaseData } from '../../services/initFirebase';

const DatabaseAdmin = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleResetClick = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmReset = async () => {
        setShowConfirmModal(false);
        console.log('🔄 Starting reset process...');
        setLoading(true);
        setMessage(null);

        try {
            console.log('📞 Calling resetFirebaseData...');
            await resetFirebaseData();
            console.log('✅ resetFirebaseData returned success');
            setMessage({
                type: 'success',
                text: '✅ Base de données réinitialisée avec succès ! Les utilisateurs, classes et relations parent-étudiant ont été créés.'
            });
        } catch (error) {
            console.error('❌ Error during reset:', error);
            setMessage({
                type: 'error',
                text: `❌ Erreur: ${error}`
            });
        } finally {
            setLoading(false);
            console.log('🏁 Reset process finished');
        }
    };

    const handleClear = async () => {
        if (!confirm('⚠️ Ceci va supprimer TOUTES les données sans les réinitialiser. Continuer ?')) {
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await clearAllData();
            setMessage({
                type: 'success',
                text: '✅ Toutes les données ont été supprimées.'
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: `❌ Erreur: ${error}`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        if (!confirm('➕ Ceci va ajouter les données de test. Continuer ?')) {
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await initializeFirebaseData();
            setMessage({
                type: 'success',
                text: '✅ Données de test ajoutées avec succès !'
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: `❌ Erreur: ${error}`
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administration Base de Données</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gérer les données Firebase</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${message.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
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
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🔄 Réinitialiser la Base de Données</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Supprime toutes les données existantes et crée de nouvelles données de test avec des relations parent-étudiant correctes.
                        </p>
                        <Button
                            onClick={handleResetClick}
                            disabled={loading}
                            icon={RefreshCw}
                            className="bg-gradient-to-r from-orange-500 to-orange-600"
                        >
                            {loading ? 'Réinitialisation...' : 'Réinitialiser Tout'}
                        </Button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">➕ Ajouter des Données de Test</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Ajoute uniquement les données de test sans supprimer les données existantes.
                        </p>
                        <Button
                            onClick={handleInitialize}
                            disabled={loading}
                            icon={Database}
                            variant="secondary"
                        >
                            {loading ? 'Ajout en cours...' : 'Ajouter Données'}
                        </Button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🗑️ Supprimer Toutes les Données</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Supprime toutes les données sans les réinitialiser. ⚠️ Action irréversible !
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

                    <div className="border-t border-gray-200 dark:border-slate-600 pt-6 bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Données qui seront créées :</h3>
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            <li>• 1 Super Admin</li>
                            <li>• 1 Directeur</li>
                            <li>• 3 Professeurs</li>
                            <li>• 8 Étudiants (répartis dans 4 classes)</li>
                            <li>• 7 Parents (avec relations correctes vers leurs enfants)</li>
                            <li>• 4 Classes (6ème A, 5ème B, 4ème C, 3ème A)</li>
                        </ul>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                            👨‍👩‍👧‍👦 Note: Un parent peut avoir plusieurs enfants (ex: Mr. & Mrs. Student ont Alice et George)
                        </p>
                    </div>
                </div>
            </Card>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-center gap-3 text-orange-600 mb-4">
                            <AlertCircle size={28} />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirmation Requise</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Êtes-vous sûr de vouloir réinitialiser la base de données ?
                            <br /><br />
                            ⚠️ <strong>Toutes les données actuelles seront définitivement supprimées</strong> et remplacées par les données de test.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleConfirmReset}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                Oui, Réinitialiser
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseAdmin;
