/**
 * Get stored language from localStorage
 */
export const getStoredLanguage = (): string | null => {
  return localStorage.getItem('i18nextLng');
};

/**
 * Store language preference in localStorage
 */
export const storeLanguage = (lang: string): void => {
  localStorage.setItem('i18nextLng', lang);
};

/**
 * Apply language direction (LTR or RTL) to document
 */
export const applyLanguageDirection = (lang: string): void => {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
};

/**
 * Get language display name with native script
 */
export const getLanguageLabel = (lang: string): string => {
  const labels: Record<string, string> = {
    fr: 'Français',
    nl: 'Nederlands',
    ar: 'العربية',
  };
  return labels[lang] || lang;
};
