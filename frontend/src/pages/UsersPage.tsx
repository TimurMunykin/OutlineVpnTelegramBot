import React from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { useAuthStore } from '@/stores/authStore'

const UsersPage: React.FC = () => {
  const { user } = useAuthStore()

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You don't have permission to access this page.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement create user dialog
            console.log('Create new user')
          }}
        >
          Add User
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          User management interface coming soon.
        </Typography>
      </Paper>
    </Box>
  )
}

export default UsersPage