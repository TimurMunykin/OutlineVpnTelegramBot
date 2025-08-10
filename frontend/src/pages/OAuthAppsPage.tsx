import React from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material'
import { Add } from '@mui/icons-material'

const OAuthAppsPage: React.FC = () => {
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
          OAuth Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement create OAuth app dialog
            console.log('Create new OAuth app')
          }}
        >
          Create App
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No OAuth applications found. Create your first OAuth app to allow external integrations.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            OAuth apps allow other applications to authenticate users and access VPN keys on their behalf.
            Common use cases include:
          </Typography>
          <ul>
            <li><Typography variant="body2" color="text.secondary">Telegram bots</Typography></li>
            <li><Typography variant="body2" color="text.secondary">Mobile applications</Typography></li>
            <li><Typography variant="body2" color="text.secondary">CLI tools</Typography></li>
            <li><Typography variant="body2" color="text.secondary">Third-party integrations</Typography></li>
          </ul>
        </Box>
      </Paper>
    </Box>
  )
}

export default OAuthAppsPage