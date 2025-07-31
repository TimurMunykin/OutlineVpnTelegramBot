import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import { Add, Delete, ContentCopy, Info } from '@mui/icons-material'
import { vpnApi } from '../services/api'

interface VpnKey {
  id: number
  outlineKeyId: string
  accessUrl: string
  name?: string
  createdAt: string
  user?: {
    id: number
    name: string
    email: string
  }
}

const VpnKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<VpnKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const response = await vpnApi.getKeys()
      setKeys(response.data.keys || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch VPN keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    try {
      setCreating(true)
      await vpnApi.createKey(newKeyName || undefined)
      setCreateDialogOpen(false)
      setNewKeyName('')
      await fetchKeys()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create VPN key')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (keyId: number) => {
    if (!window.confirm('Are you sure you want to delete this VPN key?')) {
      return
    }

    try {
      await vpnApi.deleteKey(keyId.toString())
      await fetchKeys()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete VPN key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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
          VPN Keys
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Key
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {keys.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No VPN keys found. Click "Create Key" to generate your first VPN access key.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Access URL</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    {key.name || `Key ${key.outlineKeyId}`}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {key.accessUrl}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(key.accessUrl)}
                        title="Copy to clipboard"
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {key.user && (
                      <Box>
                        <Typography variant="body2">{key.user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {key.user.email}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteKey(key.id)}
                      title="Delete key"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New VPN Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Key Name (optional)"
            fullWidth
            variant="outlined"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="My VPN Key"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateKey}
            variant="contained"
            disabled={creating}
          >
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VpnKeysPage