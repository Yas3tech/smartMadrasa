import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { getLanguageLabel, storeLanguage, applyLanguageDirection } from '../utils/lang';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const languages = [
        { code: 'fr', label: getLanguageLabel('fr') },
        { code: 'nl', label: getLanguageLabel('nl') },
        { code: 'ar', label: getLanguageLabel('ar') }
    ];

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        storeLanguage(lang);
        applyLanguageDirection(lang);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <Languages size={18} className="text-gray-500" />
                <select
                    value={i18n.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-gray-300 transition-colors cursor-pointer"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
