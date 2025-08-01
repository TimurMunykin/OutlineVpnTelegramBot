import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAuthStore } from '@/stores/authStore'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import VpnKeysPage from '@/pages/VpnKeysPage'
import UsersPage from '@/pages/UsersPage'
import VpnClientsPage from '@/pages/VpnClientsPage'
import InvitesPage from '@/pages/InvitesPage'
import InviteRegistrationPage from '@/pages/InviteRegistrationPage'
import SettingsPage from '@/pages/SettingsPage'
import OAuthAppsPage from '@/pages/OAuthAppsPage'

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/invite/:token" element={<InviteRegistrationPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vpn-keys" element={<VpnKeysPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/vpn-clients" element={<VpnClientsPage />} />
        <Route path="/invites" element={<InvitesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/oauth-apps" element={<OAuthAppsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App