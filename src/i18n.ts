import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationFR from './locales/fr/translation.json';
import translationNL from './locales/nl/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
    fr: { translation: translationFR },
    nl: { translation: translationNL },
    ar: { translation: translationAR }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'fr',
        defaultNS: 'translation',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

// Apply RTL direction based on language
i18n.on('languageChanged', (lng) => {
    const dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
});

// Set initial direction
const currentLang = i18n.language;
const initialDir = currentLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.dir = initialDir;
document.documentElement.lang = currentLang;


export default i18n;

// Translations updated

