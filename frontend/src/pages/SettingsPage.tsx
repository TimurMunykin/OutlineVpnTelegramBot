import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import GlobalSettingsTab from '@/components/settings/GlobalSettingsTab';
import UserLimitsTab from '@/components/settings/UserLimitsTab';
import { useSettings } from '@/hooks/useSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const {
    settings,
    userLimits,
    loading,
    error,
    success,
    loadData,
    updateSetting,
    initializeSettings,
    updateUserLimit,
    deleteUserLimit,
  } = useSettings();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="Global Settings" />
            <Tab label="User Limits" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <GlobalSettingsTab
            settings={settings}
            onUpdateSetting={updateSetting}
            onInitializeSettings={initializeSettings}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <UserLimitsTab
            userLimits={userLimits}
            onUpdateUserLimit={updateUserLimit}
            onDeleteUserLimit={deleteUserLimit}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
}