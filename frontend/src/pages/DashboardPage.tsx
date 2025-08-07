import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material'
import {
  VpnKey,
  People,
  Apps,
  Security,
  Add,
  Refresh,
  PersonAdd,
  Timeline,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { vpnApi, usersApi } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface DashboardStats {
  vpnKeys: number;
  users: number;
  activeSessions: number;
}

interface RecentActivity {
  id: string;
  type: 'key_created' | 'key_deleted' | 'user_created' | 'login';
  message: string;
  timestamp: string;
  user?: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    vpnKeys: 0,
    users: 0,
    activeSessions: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const promises = [
        vpnApi.getKeys(),
        ...(user?.role === 'ADMIN' ? [usersApi.getUsers()] : []),
      ]

      const results = await Promise.allSettled(promises)
      
      const vpnKeysResult = results[0]
      const usersResult = user?.role === 'ADMIN' ? results[1] : null

      const newStats: DashboardStats = {
        vpnKeys: vpnKeysResult.status === 'fulfilled' ? vpnKeysResult.value.data.keys?.length || 0 : 0,
        users: usersResult && usersResult.status === 'fulfilled' ? usersResult.value.data.length || 0 : 0,
        activeSessions: 1, // TODO: implement real session tracking
      }

      setStats(newStats)

      // Generate mock recent activity based on actual data
      const mockActivity: RecentActivity[] = []
      
      if (vpnKeysResult.status === 'fulfilled' && vpnKeysResult.value.data.keys) {
        vpnKeysResult.value.data.keys.slice(0, 3).forEach((key: any) => {
          mockActivity.push({
            id: `key-${key.id}`,
            type: 'key_created',
            message: `VPN key "${key.name || `Key ${key.outlineKeyId}`}" was created`,
            timestamp: key.createdAt,
            user: key.user?.name || 'Unknown',
          })
        })
      }

      setRecentActivity(mockActivity)
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user?.role])

  const statsConfig = [
    {
      title: t('dashboard.stats.totalKeys'),
      value: stats.vpnKeys.toString(),
      icon: <VpnKey sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      action: () => navigate('/vpn-keys'),
    },
    ...(user?.role === 'ADMIN' ? [{
      title: t('dashboard.stats.totalUsers'),
      value: stats.users.toString(),
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#388e3c',
      action: () => navigate('/users'),
    }] : []),
    {
      title: t('dashboard.stats.activeSessions'),
      value: stats.activeSessions.toString(),
      icon: <Security sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
      action: () => {},
    },
  ]

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('dashboard.welcome', { name: user?.name })} {user?.role === 'ADMIN' && <Chip label="Admin" color="primary" size="small" />}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          {t('common.refresh')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {statsConfig.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={() => stat.action()}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {t('dashboard.recentActivity')}
              </Typography>
              <Chip icon={<Timeline />} label={`${recentActivity.length} items`} size="small" />
            </Box>
            {recentActivity.length > 0 ? (
              <List dense>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemIcon>
                      {activity.type === 'key_created' && <VpnKey color="primary" />}
                      {activity.type === 'key_deleted' && <VpnKey color="error" />}
                      {activity.type === 'user_created' && <PersonAdd color="success" />}
                      {activity.type === 'login' && <Security color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.message}
                      secondary={
                        <Box display="flex" gap={1} alignItems="center">
                          <Typography variant="caption">
                            {new Date(activity.timestamp).toLocaleString()}
                          </Typography>
                          {activity.user && (
                            <Chip label={activity.user} size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.noRecentActivity')}
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.quickActions')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/vpn-keys')}
                fullWidth
              >
                {t('dashboard.createVpnKey')}
              </Button>
              {user?.role === 'ADMIN' && (
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/users')}
                  fullWidth
                >
                  {t('dashboard.addNewUser')}
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage