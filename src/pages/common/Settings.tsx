import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/UI';
import {
  Bell,
  Globe,
  Moon,
  Sun,
  Monitor,
  Mail,
  MessageSquare,
  Calendar,
  GraduationCap,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';


interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    messages: boolean;
    grades: boolean;
    attendance: boolean;
    events: boolean;
  };
  display: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    push: true,
    messages: true,
    grades: true,
    attendance: true,
    events: true,
  },
  display: {
    language: 'fr',
    theme: 'light',
  },
};


const loadSettings = (): UserSettings => {
  try {
    const saved = localStorage.getItem('smartmadrassa_settings');
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
  }
  return defaultSettings;
};


const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

const Settings = () => {
  const { t, i18n } = useTranslation();
  useAuth();


  const savedSettings = loadSettings();


  const [emailNotifications, setEmailNotifications] = useState(savedSettings.notifications.email);
  const [pushNotifications, setPushNotifications] = useState(savedSettings.notifications.push);
  const [messageNotifications, setMessageNotifications] = useState(
    savedSettings.notifications.messages
  );
  const [gradeNotifications, setGradeNotifications] = useState(savedSettings.notifications.grades);
  const [attendanceNotifications, setAttendanceNotifications] = useState(
    savedSettings.notifications.attendance
  );
  const [eventNotifications, setEventNotifications] = useState(savedSettings.notifications.events);


  const [language, setLanguage] = useState(i18n.language || savedSettings.display.language);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(savedSettings.display.theme);


  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleSaveSettings = () => {
    const settings: UserSettings = {
      notifications: {
        email: emailNotifications,
        push: pushNotifications,
        messages: messageNotifications,
        grades: gradeNotifications,
        attendance: attendanceNotifications,
        events: eventNotifications,
      },
      display: {
        language,
        theme,
      },
    };


    localStorage.setItem('smartmadrassa_settings', JSON.stringify(settings));


    applyTheme(theme);

    toast.success(t('settings.settingsSaved'));
  };

  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <Button variant="primary" icon={Save} onClick={handleSaveSettings}>
          {t('settings.saveSettings')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-1">
              <a
                href="#notifications"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium"
              >
                <Bell size={20} />
                {t('settings.notifications_settings')}
              </a>
              <a
                href="#display"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Monitor size={20} />
                {t('settings.appearance')}
              </a>
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notifications */}
          <Card className="p-6" id="notifications">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Bell className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('settings.notifications_settings')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {t('settings.notificationsSubtitle')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-600 dark:text-slate-400" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {t('settings.emailNotifications')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {t('settings.emailNotificationsDesc')}
                    </p>
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
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="text-gray-600" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">{t('settings.pushNotifications')}</p>
                    <p className="text-sm text-gray-500">{t('settings.pushNotificationsDesc')}</p>
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
              <div className={`border-t pt-4 mt-4 ${isRTL ? 'border-r-0' : 'border-l-0'}`}>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {t('settings.notificationTypes')}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="text-gray-500" size={16} />
                      <span className="text-sm text-gray-700">{t('common.messages')}</span>
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
                      <span className="text-sm text-gray-700">{t('sidebar.grades')}</span>
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
                      <span className="text-sm text-gray-700">{t('sidebar.attendance')}</span>
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
                      <span className="text-sm text-gray-700">{t('calendar.event')}</span>
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
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Monitor className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('settings.appearance')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {t('settings.appearanceSubtitle')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Language */}
              <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="text-gray-600 dark:text-slate-400" size={20} />
                  <label className="font-semibold text-gray-900 dark:text-white">
                    {t('settings.language')}
                  </label>
                </div>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-500 outline-none"
                >
                  <option value="fr">Français</option>
                  <option value="nl">Nederlands</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              {/* Theme */}
              <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Sun className="text-gray-600 dark:text-slate-400" size={20} />
                  <label className="font-semibold text-gray-900 dark:text-white">
                    {t('settings.theme')}
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-lg border-2 transition-colors ${theme === 'light'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                      }`}
                  >
                    <Sun className="mx-auto mb-2 text-gray-600 dark:text-slate-300" size={24} />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('settings.light')}
                    </p>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-lg border-2 transition-colors ${theme === 'dark'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                      }`}
                  >
                    <Moon className="mx-auto mb-2 text-gray-600 dark:text-slate-300" size={24} />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('settings.dark')}
                    </p>
                  </button>
                  <button
                    onClick={() => handleThemeChange('auto')}
                    className={`p-4 rounded-lg border-2 transition-colors ${theme === 'auto'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                      }`}
                  >
                    <Monitor className="mx-auto mb-2 text-gray-600 dark:text-slate-300" size={24} />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('settings.auto')}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
