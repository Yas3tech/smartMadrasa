import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/UI';
import {
    Bell,
    Globe,
    Moon,
    Sun,
    Shield,
    Monitor,
    Mail,
    MessageSquare,
    Calendar,
    GraduationCap,
    Save,
    Settings as SettingsIcon
} from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();

    // Notification Settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [messageNotifications, setMessageNotifications] = useState(true);
    const [gradeNotifications, setGradeNotifications] = useState(true);
    const [attendanceNotifications, setAttendanceNotifications] = useState(true);
    const [eventNotifications, setEventNotifications] = useState(true);

    // Display Settings
    const [language, setLanguage] = useState('fr');
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
    const [compactView, setCompactView] = useState(false);

    // Privacy Settings
    const [profileVisibility, setProfileVisibility] = useState('public');
    const [showEmail, setShowEmail] = useState(false);

    const handleSaveSettings = () => {
        // In real app, would save to Firebase
        const settings = {
            notifications: {
                email: emailNotifications,
                push: pushNotifications,
                messages: messageNotifications,
                grades: gradeNotifications,
                attendance: attendanceNotifications,
                events: eventNotifications
            },
            display: {
                language,
                theme,
                compactView
            },
            privacy: {
                profileVisibility,
                showEmail
            }
        };
        console.log('Saving settings:', settings);
        alert('Paramètres enregistrés avec succès!');
    };

    const isAdmin = user?.role === 'director' || user?.role === 'superadmin';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
                <Button variant="primary" icon={Save} onClick={handleSaveSettings}>
                    Enregistrer les modifications
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Navigation */}
                <div className="lg:col-span-1">
                    <Card className="p-4">
                        <nav className="space-y-1">
                            <a href="#notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 text-orange-600 font-medium">
                                <Bell size={20} />
                                Notifications
                            </a>
                            <a href="#display" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                <Monitor size={20} />
                                Affichage
                            </a>
                            <a href="#privacy" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                <Shield size={20} />
                                Confidentialité
                            </a>
                            {isAdmin && (
                                <a href="#system" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                    <SettingsIcon size={20} />
                                    Système
                                </a>
                            )}
                        </nav>
                    </Card>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Notifications */}
                    <Card className="p-6" id="notifications">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Bell className="text-orange-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                                <p className="text-sm text-gray-500">Gérez vos préférences de notification</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Email Notifications */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Mail className="text-gray-600" size={20} />
                                    <div>
                                        <p className="font-semibold text-gray-900">Notifications par email</p>
                                        <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                                    </div>
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

                            {/* Push Notifications */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Bell className="text-gray-600" size={20} />
                                    <div>
                                        <p className="font-semibold text-gray-900">Notifications push</p>
                                        <p className="text-sm text-gray-500">Recevoir des notifications dans l'app</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={pushNotifications}
                                        onChange={(e) => setPushNotifications(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>

                            {/* Specific Notification Types */}
                            <div className="border-t pt-4 mt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-3">Types de notifications</p>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="text-gray-500" size={16} />
                                            <span className="text-sm text-gray-700">Messages</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={messageNotifications}
                                            onChange={(e) => setMessageNotifications(e.target.checked)}
                                            className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-200"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="text-gray-500" size={16} />
                                            <span className="text-sm text-gray-700">Notes</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={gradeNotifications}
                                            onChange={(e) => setGradeNotifications(e.target.checked)}
                                            className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-200"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="text-gray-500" size={16} />
                                            <span className="text-sm text-gray-700">Présence</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={attendanceNotifications}
                                            onChange={(e) => setAttendanceNotifications(e.target.checked)}
                                            className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-200"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="text-gray-500" size={16} />
                                            <span className="text-sm text-gray-700">Événements</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={eventNotifications}
                                            onChange={(e) => setEventNotifications(e.target.checked)}
                                            className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Display Settings */}
                    <Card className="p-6" id="display">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Monitor className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Affichage</h2>
                                <p className="text-sm text-gray-500">Personnalisez l'apparence de l'application</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Language */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <Globe className="text-gray-600" size={20} />
                                    <label className="font-semibold text-gray-900">Langue</label>
                                </div>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                >
                                    <option value="fr">Français</option>
                                    <option value="nl">Nederlands</option>
                                    <option value="ar">العربية</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            {/* Theme */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sun className="text-gray-600" size={20} />
                                    <label className="font-semibold text-gray-900">Thème</label>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 rounded-lg border-2 transition-colors ${theme === 'light'
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Sun className="mx-auto mb-2 text-gray-600" size={24} />
                                        <p className="text-sm font-medium text-gray-900">Clair</p>
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 rounded-lg border-2 transition-colors ${theme === 'dark'
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Moon className="mx-auto mb-2 text-gray-600" size={24} />
                                        <p className="text-sm font-medium text-gray-900">Sombre</p>
                                    </button>
                                    <button
                                        onClick={() => setTheme('auto')}
                                        className={`p-4 rounded-lg border-2 transition-colors ${theme === 'auto'
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Monitor className="mx-auto mb-2 text-gray-600" size={24} />
                                        <p className="text-sm font-medium text-gray-900">Auto</p>
                                    </button>
                                </div>
                            </div>

                            {/* Compact View */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-900">Mode compact</p>
                                    <p className="text-sm text-gray-500">Affichage plus dense</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={compactView}
                                        onChange={(e) => setCompactView(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* Privacy Settings */}
                    <Card className="p-6" id="privacy">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Shield className="text-green-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Confidentialité</h2>
                                <p className="text-sm text-gray-500">Contrôlez vos informations personnelles</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <label className="font-semibold text-gray-900 mb-3 block">Visibilité du profil</label>
                                <select
                                    value={profileVisibility}
                                    onChange={(e) => setProfileVisibility(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                >
                                    <option value="public">Public (tous les utilisateurs)</option>
                                    <option value="school">École (enseignants et admin)</option>
                                    <option value="private">Privé (seulement moi)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-900">Afficher l'email</p>
                                    <p className="text-sm text-gray-500">Rendre votre email visible aux autres</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showEmail}
                                        onChange={(e) => setShowEmail(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* System Settings (Admin Only) */}
                    {isAdmin && (
                        <Card className="p-6" id="system">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <SettingsIcon className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Paramètres système</h2>
                                    <p className="text-sm text-gray-500">Configuration de l'école</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button variant="secondary" className="w-full justify-start">
                                    Gérer l'année académique
                                </Button>
                                <Button variant="secondary" className="w-full justify-start">
                                    Configuration des notes
                                </Button>
                                <Button variant="secondary" className="w-full justify-start">
                                    Politiques de présence
                                </Button>
                                <Button variant="secondary" className="w-full justify-start">
                                    Intégrations
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
