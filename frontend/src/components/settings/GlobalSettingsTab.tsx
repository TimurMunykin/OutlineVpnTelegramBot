import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import SettingEditor from './SettingEditor';

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface GlobalSettingsTabProps {
  settings: Setting[];
  onUpdateSetting: (key: string, value: string) => Promise<void>;
  onInitializeSettings: () => Promise<void>;
}

export default function GlobalSettingsTab({ 
  settings, 
  onUpdateSetting, 
  onInitializeSettings 
}: GlobalSettingsTabProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Global Application Settings</Typography>
        <Button variant="outlined" onClick={onInitializeSettings}>
          Initialize Defaults
        </Button>
      </Box>

      <Box display="flex" flexDirection="column" gap={3}>
        {settings.map((setting) => (
          <Box key={setting.key}>
            <SettingEditor
              setting={setting}
              onUpdate={onUpdateSetting}
            />
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
        {settings.length === 0 && (
          <Alert severity="info">
            No settings found. Click "Initialize Defaults" to create default settings.
          </Alert>
        )}
      </Box>
    </Box>
  );
}