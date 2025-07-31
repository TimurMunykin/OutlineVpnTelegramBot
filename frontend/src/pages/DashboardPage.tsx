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
import { vpnApi, usersApi, oauthApi } from '../services/api'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  vpnKeys: number;
  users: number;
  oauthApps: number;
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    vpnKeys: 0,
    users: 0,
    oauthApps: 0,
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
        oauthApi.getApps(),
      ]

      const results = await Promise.allSettled(promises)
      
      const vpnKeysResult = results[0]
      const usersResult = user?.role === 'ADMIN' ? results[1] : null
      const oauthResult = results[user?.role === 'ADMIN' ? 2 : 1]

      const newStats: DashboardStats = {
        vpnKeys: vpnKeysResult.status === 'fulfilled' ? vpnKeysResult.value.data.keys?.length || 0 : 0,
        users: usersResult && usersResult.status === 'fulfilled' ? usersResult.value.data.length || 0 : 0,
        oauthApps: oauthResult.status === 'fulfilled' ? oauthResult.value.data.length || 0 : 0,
        activeSessions: 1, // TODO: implement real session tracking
      }

      setStats(newStats)

      // Generate mock recent activity based on actual data
      const mockActivity: RecentActivity[] = []
      
      if (vpnKeysResult.status === 'fulfilled' && vpnKeysResult.value.data.keys) {
        vpnKeysResult.value.data.keys.slice(0, 3).forEach((key: any, index: number) => {
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
      title: 'VPN Keys',
      value: stats.vpnKeys.toString(),
      icon: <VpnKey sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      action: () => navigate('/vpn-keys'),
    },
    ...(user?.role === 'ADMIN' ? [{
      title: 'Users',
      value: stats.users.toString(),
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#388e3c',
      action: () => navigate('/users'),
    }] : []),
    {
      title: 'OAuth Apps',
      value: stats.oauthApps.toString(),
      icon: <Apps sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      action: () => navigate('/oauth-apps'),
    },
    {
      title: 'Active Sessions',
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
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name}! {user?.role === 'ADMIN' && <Chip label="Admin" color="primary" size="small" />}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          Refresh
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
                cursor: stat.action ? 'pointer' : 'default',
                '&:hover': stat.action ? { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                } : {},
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={stat.action}
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
                Recent Activity
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
                No recent activity to display.
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/vpn-keys')}
                fullWidth
              >
                Create VPN Key
              </Button>
              <Button
                variant="outlined"
                startIcon={<Apps />}
                onClick={() => navigate('/oauth-apps')}
                fullWidth
              >
                Manage OAuth Apps
              </Button>
              {user?.role === 'ADMIN' && (
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/users')}
                  fullWidth
                >
                  Add New User
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