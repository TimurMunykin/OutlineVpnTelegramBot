import React from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material'
import { Add } from '@mui/icons-material'

const VpnKeysPage: React.FC = () => {
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
          VPN Keys
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement create key dialog
            console.log('Create new VPN key')
          }}
        >
          Create Key
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No VPN keys found. Click "Create Key" to generate your first VPN access key.
        </Typography>
      </Paper>
    </Box>
  )
}

export default VpnKeysPage