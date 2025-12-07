import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/UI';
import {
    School,
    Calendar,
    GraduationCap,
    Bell,
    Database,
    Shield,
    Save
} from 'lucide-react';

const AdminSettings = () => {
    const { user } = useAuth();

    const [schoolName, setSchoolName] = useState('École Smartschool');
    const [academicYear, setAcademicYear] = useState('2024-2025');
    const [maxGrade, setMaxGrade] = useState(100);
    const [passingGrade, setPassingGrade] = useState(50);
    const [autoBackup, setAutoBackup] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);

    if (user?.role !== 'director' && user?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès restreint</h2>
                    <p className="text-gray-600">Cette page est réservée aux directeurs et super-administrateurs.</p>
                </Card>
            </div>
        );
    }

    const handleSaveSettings = () => {
        // In real app, would save to Firebase
        alert('Paramètres sauvegardés avec succès!');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Paramètres système</h1>
                    <p className="text-gray-600">Configuration de l'école et du système</p>
                </div>
                <Button variant="primary" icon={Save} onClick={handleSaveSettings}>
                    Enregistrer
                </Button>
            </div>

            {/* School Information */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <School className="text-orange-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Informations de l'école</h2>
                        <p className="text-sm text-gray-500">Détails généraux de l'établissement</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'école</label>
                        <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <input
                            type="text"
                            defaultValue="123 Rue de l'Éducation, Casablanca"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                            type="tel"
                            defaultValue="+212 5XX-XXXXXX"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            defaultValue="contact@smartschool.ma"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>
                </div>
            </Card>

            {/* Academic Configuration */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Configuration académique</h2>
                        <p className="text-sm text-gray-500">Année scolaire et paramètres pédagogiques</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Année académique</label>
                        <select
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        >
                            <option value="2023-2024">2023-2024</option>
                            <option value="2024-2025">2024-2025</option>
                            <option value="2025-2026">2025-2026</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de trimestres</label>
                        <select
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        >
                            <option value="2">2 Semestres</option>
                            <option value="3" selected>3 Trimestres</option>
                            <option value="4">4 Trimestres</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Grading System */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <GraduationCap className="text-green-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Système de notation</h2>
                        <p className="text-sm text-gray-500">Configuration des notes et de l'évaluation</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note maximale</label>
                        <input
                            type="number"
                            value={maxGrade}
                            onChange={(e) => setMaxGrade(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note de passage (%)</label>
                        <input
                            type="number"
                            value={passingGrade}
                            onChange={(e) => setPassingGrade(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Échelle de notation</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-green-900">Excellent</span>
                            <span className="text-sm text-green-700">80-100%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-900">Bien</span>
                            <span className="text-sm text-blue-700">60-79%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <span className="text-sm font-medium text-yellow-900">Moyen</span>
                            <span className="text-sm text-yellow-700">40-59%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-red-900">Insuffisant</span>
                            <span className="text-sm text-red-700">\u003c40%</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Bell className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                        <p className="text-sm text-gray-500">Paramètres de notification système</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-900">Notifications par email</p>
                            <p className="text-sm text-gray-500">Envoyer des notifications importantes par email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) => setEmailNotifications(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-900">Alertes absences</p>
                            <p className="text-sm text-gray-500">Alerter les parents en cas d'absence</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-900">Nouvelles notes</p>
                            <p className="text-sm text-gray-500">Notifier quand une nouvelle note est publiée</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>
                </div>
            </Card>

            {/* Security & Backup */}
            {user?.role === 'superadmin' && (
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Database className="text-red-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Sécurité et sauvegarde</h2>
                            <p className="text-sm text-gray-500">Paramètres de sécurité et de sauvegarde automatique</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-gray-900">Sauvegarde automatique</p>
                                <p className="text-sm text-gray-500">Sauvegarder quotidiennement les données</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoBackup}
                                    onChange={(e) => setAutoBackup(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="secondary" className="flex-1">
                                Créer une sauvegarde
                            </Button>
                            <Button variant="secondary" className="flex-1">
                                Restaurer
                            </Button>
                        </div>

                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Dernière sauvegarde:</strong> {new Date().toLocaleString('fr-FR')}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Permissions (SuperAdmin only) */}
            {user?.role === 'superadmin' && (
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Shield className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Permissions</h2>
                            <p className="text-sm text-gray-500">Gestion des permissions par rôle</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {['director', 'teacher', 'parent', 'student'].map(role => (
                            <div key={role} className="p-4 bg-gray-50 rounded-xl">
                                <h4 className="font-semibold text-gray-900 mb-3 capitalize">{role}</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span>Créer</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span>Lire</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked={role === 'director' || role === 'teacher'} className="rounded" />
                                        <span>Modifier</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked={role === 'director'} className="rounded" />
                                        <span>Supprimer</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default AdminSettings;
