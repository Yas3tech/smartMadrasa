import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isRTL = i18n.language === 'ar';

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
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('adminSettings.restrictedAccess')}</h2>
                    <p className="text-gray-600">{t('adminSettings.restrictedAccessDesc')}</p>
                </Card>
            </div>
        );
    }

    const handleSaveSettings = () => {
        // In real app, would save to Firebase
        alert(t('adminSettings.saveSuccess'));
    };

    const locale = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'nl' ? 'nl-NL' : 'fr-FR';

    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('adminSettings.title')}</h1>
                    <p className="text-gray-600">{t('adminSettings.subtitle')}</p>
                </div>
                <Button variant="primary" icon={Save} onClick={handleSaveSettings}>
                    {t('common.save')}
                </Button>
            </div>

            {/* School Information */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <School className="text-orange-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{t('adminSettings.schoolInfo')}</h2>
                        <p className="text-sm text-gray-500">{t('adminSettings.schoolInfoDesc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminSettings.schoolName')}</label>
                        <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminSettings.address')}</label>
                        <input
                            type="text"
                            defaultValue="123 Rue de l'Éducation, Casablanca"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminSettings.phone')}</label>
                        <input
                            type="tel"
                            defaultValue="+212 5XX-XXXXXX"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminSettings.email')}</label>
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
                        <h2 className="text-xl font-bold text-gray-900">{t('adminSettings.academicConfig')}</h2>
                        <p className="text-sm text-gray-500">{t('adminSettings.academicConfigDesc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminSettings.academicYear')}</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminSettings.numberOfTerms')}</label>
                        <select
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        >
                            <option value="2">{t('adminSettings.semesters', { count: 2 })}</option>
                            <option value="3" selected>{t('adminSettings.terms', { count: 3 })}</option>
                            <option value="4">{t('adminSettings.terms', { count: 4 })}</option>
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
                        <h2 className="text-xl font-bold text-gray-900">{t('adminSettings.gradingSystem')}</h2>
                        <p className="text-sm text-gray-500">{t('adminSettings.gradingSystemDesc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminSettings.maxGrade')}</label>
                        <input
                            type="number"
                            value={maxGrade}
                            onChange={(e) => setMaxGrade(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminSettings.passingGrade')}</label>
                        <input
                            type="number"
                            value={passingGrade}
                            onChange={(e) => setPassingGrade(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">{t('adminSettings.gradingScale')}</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-green-900">{t('analytics.excellent')}</span>
                            <span className="text-sm text-green-700">80-100%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-900">{t('analytics.good')}</span>
                            <span className="text-sm text-blue-700">60-79%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <span className="text-sm font-medium text-yellow-900">{t('analytics.average')}</span>
                            <span className="text-sm text-yellow-700">40-59%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-red-900">{t('analytics.insufficient')}</span>
                            <span className="text-sm text-red-700">&lt;40%</span>
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
                        <h2 className="text-xl font-bold text-gray-900">{t('adminSettings.notifications')}</h2>
                        <p className="text-sm text-gray-500">{t('adminSettings.notificationsDesc')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-900">{t('adminSettings.emailNotifications')}</p>
                            <p className="text-sm text-gray-500">{t('adminSettings.emailNotificationsDesc')}</p>
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
                            <p className="font-semibold text-gray-900">{t('adminSettings.absenceAlerts')}</p>
                            <p className="text-sm text-gray-500">{t('adminSettings.absenceAlertsDesc')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-900">{t('adminSettings.newGrades')}</p>
                            <p className="text-sm text-gray-500">{t('adminSettings.newGradesDesc')}</p>
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
                            <h2 className="text-xl font-bold text-gray-900">{t('adminSettings.securityBackup')}</h2>
                            <p className="text-sm text-gray-500">{t('adminSettings.securityBackupDesc')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-gray-900">{t('adminSettings.autoBackup')}</p>
                                <p className="text-sm text-gray-500">{t('adminSettings.autoBackupDesc')}</p>
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
                                {t('adminSettings.createBackup')}
                            </Button>
                            <Button variant="secondary" className="flex-1">
                                {t('adminSettings.restore')}
                            </Button>
                        </div>

                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>{t('adminSettings.lastBackup')}:</strong> {new Date().toLocaleString(locale)}
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
                            <h2 className="text-xl font-bold text-gray-900">{t('adminSettings.permissions')}</h2>
                            <p className="text-sm text-gray-500">{t('adminSettings.permissionsDesc')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {['director', 'teacher', 'parent', 'student'].map(role => (
                            <div key={role} className="p-4 bg-gray-50 rounded-xl">
                                <h4 className="font-semibold text-gray-900 mb-3">{t(`roles.${role}`)}</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span>{t('adminSettings.permCreate')}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked className="rounded" />
                                        <span>{t('adminSettings.permRead')}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked={role === 'director' || role === 'teacher'} className="rounded" />
                                        <span>{t('adminSettings.permEdit')}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked={role === 'director'} className="rounded" />
                                        <span>{t('adminSettings.permDelete')}</span>
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
