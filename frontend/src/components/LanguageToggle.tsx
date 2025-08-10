import React, { useState } from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const languages = [
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'en', flag: '🇺🇸', name: 'English' },
];

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLanguageChange = async (_: React.MouseEvent<HTMLElement>, newLanguage: string) => {
    if (!newLanguage || newLanguage === i18n.language) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Обновляем язык в i18n (локально)
      await i18n.changeLanguage(newLanguage);
      
      // Если пользователь авторизован, сохраняем в базе данных
      if (user) {
        await api.put('/users/language', {
          preferredLanguage: newLanguage,
        });

        // Обновляем пользователя в store
        updateUser({ ...user, preferredLanguage: newLanguage });
      }
      
      // Сохраняем в localStorage (для неавторизованных пользователей)
      localStorage.setItem('i18nextLng', newLanguage);
      
    } catch (error: any) {
      console.error('Error updating language:', error);
      setError(error?.response?.data?.error || 'Failed to update language');
      
      // Возвращаем предыдущий язык при ошибке
      await i18n.changeLanguage(user?.preferredLanguage || 'ru');
    } finally {
      setLoading(false);
    }
  };

  const currentLanguage = user?.preferredLanguage || i18n.language || 'ru';

  return (
    <>
      <ToggleButtonGroup
        value={currentLanguage}
        exclusive
        onChange={handleLanguageChange}
        aria-label="language selection"
        size="small"
        disabled={loading}
        sx={{
          '& .MuiToggleButton-root': {
            border: '1px solid rgba(255, 255, 255, 0.23)',
            color: 'inherit',
            minWidth: '40px',
            padding: '4px 8px',
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              color: 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.24)',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          },
        }}
      >
        {languages.map((language) => (
          <Tooltip key={language.code} title={language.name} arrow>
            <ToggleButton 
              value={language.code}
              aria-label={language.name}
            >
              {loading && currentLanguage === language.code ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <span style={{ fontSize: '18px' }}>{language.flag}</span>
              )}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
      
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ 
            position: 'absolute',
            top: 60,
            right: 0,
            maxWidth: 300,
            zIndex: 9999
          }}
        >
          {error}
        </Alert>
      )}
    </>
  );
};