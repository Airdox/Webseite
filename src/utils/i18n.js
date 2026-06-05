import { LOCALES } from './i18nMessages.js';

export const getLocale = () => {
    if (typeof window !== 'undefined' && window.__SITE_LANG__) return window.__SITE_LANG__;
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de')) return 'de';
    return 'en';
};

const locale = getLocale();

export const t = (key) => LOCALES[locale]?.[key] ?? LOCALES.de[key] ?? key;
export const getCurrentLocale = () => locale;
