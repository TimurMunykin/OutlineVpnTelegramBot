import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import ruTranslation from './locales/ru/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ru', // По умолчанию русский
    debug: import.meta.env.DEV,
    
    interpolation: {
      escapeValue: false, // React уже экранирует значения
    },

    resources: {
      en: {
        translation: enTranslation,
      },
      ru: {
        translation: ruTranslation,
      },
    },

    detection: {
      // Порядок определения языка
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Ключи для хранения в localStorage
      lookupLocalStorage: 'i18nextLng',
      
      // Кэшировать определенный язык
      caches: ['localStorage'],
    },
  });

export default i18n;