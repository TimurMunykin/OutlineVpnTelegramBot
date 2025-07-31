import React from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material'
import {
  VpnKey,
  People,
  Apps,
  Security,
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/authStore'

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()

  const stats = [
    {
      title: 'VPN Keys',
      value: '0',
      icon: <VpnKey sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    ...(user?.role === 'admin' ? [{
      title: 'Users',
      value: '1',
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#388e3c',
    }] : []),
    {
      title: 'OAuth Apps',
      value: '0',
      icon: <Apps sx={{ fontSize: 40 }} />,
      color: '#f57c00',
    },
    {
      title: 'Active Sessions',
      value: '1',
      icon: <Security sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
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
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No recent activity to display.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Create new VPN key<br />
              • Manage OAuth applications<br />
              {user?.role === 'admin' && '• Add new user<br />'}
              • View system logs
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage