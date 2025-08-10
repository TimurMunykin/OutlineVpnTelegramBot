import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

export const useLanguageInit = () => {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.preferredLanguage && i18n.language !== user.preferredLanguage) {
      // Устанавливаем язык пользователя если он отличается от текущего
      i18n.changeLanguage(user.preferredLanguage);
    }
  }, [user?.preferredLanguage, i18n]);
};