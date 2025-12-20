import React, { useState } from 'react';
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

const FirstRunSetup: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [seedData, setSeedData] = useState(true);

    // Admin account state
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !db) return;

        if (adminPassword !== confirmPassword) {
            toast.error(t('auth.errors.passwordsDoNotMatch', 'Les mots de passe ne correspondent pas.'));
            return;
        }

        setLoading(true);
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            const user = userCredential.user;

            // 2. Update Profile
            await updateProfile(user, { displayName: adminName });
            toast.success(t('setup.authCreated', 'Compte authentification créé avec succès'));


            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: adminName,
                email: adminEmail,
                role: 'superadmin',
                avatar: '👤',
                createdAt: new Date().toISOString(),
            });

            // 4. Optionally seed basic system data
            if (seedData) {
                toast.loading(t('setup.seedingData', 'Initialisation des paramètres école...'), { id: 'seed' });
                await seedSystemBasics();
                toast.success(t('setup.seedSuccess', 'Paramètres initialisés avec succès !'), { id: 'seed' });
            }

            setStep(3); // Go to success step
        } catch (error: any) {
            toast.error(error.message || t('auth.errors.generic'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                        SmartMadrassa
                    </h1>
                    <p className="text-lg text-gray-600">
                        Assistant de configuration initiale
                    </p>
                </div>

                <Card className="p-8 shadow-2xl border-0 overflow-hidden relative">
                    {/* Progress Indicator */}
                    <div className="flex justify-between mb-12 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 -z-10"></div>
                        <div className="absolute top-1/2 left-0 h-0.5 bg-orange-500 -translate-y-1/2 -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
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
                                <h2 className="text-2xl font-bold text-gray-900">Bienvenue sur votre plateforme</h2>
                                <p className="text-gray-500 mt-2">
                                    Nous avons détecté qu'il s'agit du premier lancement. Commençons par configurer votre compte administrateur.
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
                                <ShieldCheck className="flex-shrink-0" size={20} />
                                <p>
                                    Ce premier compte aura les droits <strong>SuperAdmin</strong>, lui permettant de paramétrer l'ensemble de l'école.
                                </p>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={() => setStep(2)}
                                    className="w-full py-4 text-lg font-bold bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg"
                                    icon={ArrowRight}
                                >
                                    Démarrer la configuration
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleCreateAdmin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                                <UserPlus className="text-orange-500" size={24} />
                                <h2 className="text-xl font-bold text-gray-900">Compte Administrateur Initial</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nom complet"
                                    required
                                    value={adminName}
                                    onChange={(e) => setAdminName(e.target.value)}
                                    placeholder="ex: Dr. Hassan El Fassi"
                                />
                                <Input
                                    label="Email professionnel"
                                    type="email"
                                    required
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    placeholder="admin@ecole.com"
                                />
                                <Input
                                    label="Mot de passe"
                                    type="password"
                                    required
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Input
                                    label="Confirmer le mot de passe"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
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
                                        <span className="font-semibold text-gray-900">Pré-configurer l'école</span>
                                        <p className="text-xs text-gray-500">Initialise les périodes scolaires et catégories de notes par défaut.</p>
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
                                    Précédent
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg transition-all"
                                    disabled={loading}
                                >
                                    {loading ? 'Création en cours...' : 'Finaliser la configuration'}
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
                                <h2 className="text-3xl font-extrabold text-gray-900">Configuration Terminée !</h2>
                                <p className="text-gray-500">
                                    Votre compte superadmin a été créé et le système est prêt.
                                </p>
                            </div>

                            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-orange-800">
                                <p className="font-medium mb-1">Résumé de vos accès :</p>
                                <p className="text-sm font-bold">{adminEmail}</p>
                                <p className="text-xs mt-2 opacity-75">Veuillez conserver précieusement vos identifiants.</p>
                            </div>

                            <Button
                                onClick={() => navigate('/')}
                                className="w-full py-4 text-xl font-bold bg-gray-900 hover:bg-black transition-colors"
                            >
                                Accéder au tableau de bord
                            </Button>
                        </div>
                    )}
                </Card>

                <p className="text-center text-gray-400 text-sm mt-8">
                    SmartMadrassa &copy; 2024 - Tous droits réservés
                </p>
            </div>
        </div>
    );
};

export default FirstRunSetup;
