import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface SettingEditorProps {
  setting: Setting;
  onUpdate: (key: string, value: string) => Promise<void>;
}

export default function SettingEditor({ setting, onUpdate }: SettingEditorProps) {
  const [value, setValue] = useState(setting.value);
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    await onUpdate(setting.key, value);
    setEditing(false);
  };

  const handleCancel = () => {
    setValue(setting.value);
    setEditing(false);
  };

  const isBooleanSetting = setting.value === 'true' || setting.value === 'false';
  const isNumberSetting = setting.key.includes('max_keys') || setting.key.includes('limit');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" fontWeight="medium">
          {setting.key}
        </Typography>
        {!editing && (
          <Button size="small" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </Box>
      
      {setting.description && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {setting.description}
        </Typography>
      )}

      {editing ? (
        <Box display="flex" alignItems="center" gap={2}>
          {isBooleanSetting ? (
            <FormControlLabel
              control={
                <Switch
                  checked={value === 'true'}
                  onChange={(e) => setValue(e.target.checked ? 'true' : 'false')}
                />
              }
              label={value === 'true' ? 'Enabled' : 'Disabled'}
            />
          ) : (
            <TextField
              type={isNumberSetting ? 'number' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              size="small"
              inputProps={isNumberSetting ? { min: 0, max: 100 } : {}}
            />
          )}
          <Button size="small" variant="contained" onClick={handleSave}>
            Save
          </Button>
          <Button size="small" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
      ) : (
        <Box display="flex" alignItems="center" gap={2}>
          {isBooleanSetting ? (
            <Chip 
              label={value === 'true' ? 'Enabled' : 'Disabled'}
              color={value === 'true' ? 'success' : 'default'}
              size="small"
            />
          ) : (
            <Typography variant="body1" fontFamily="monospace">
              {value}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}