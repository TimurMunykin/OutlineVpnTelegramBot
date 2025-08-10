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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material'
import { 
  Add, 
  Delete, 
  Edit, 
  Person, 
  VpnKey,
  Phone,
  Telegram,
  DateRange,
  Link as LinkIcon,
  ContentCopy,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { vpnClientsApi, invitesApi, vpnApi } from '../services/api'

interface UnassociatedKey {
  id: string
  name?: string
  accessUrl: string
}

interface VpnClient {
  id: number
  name: string
  phone?: string
  telegramId?: string
  notes?: string
  migrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  migratedToUserId?: number
  createdAt: string
  updatedAt: string
  creator: {
    id: number
    name: string
    email: string
  }
  migratedUser?: {
    id: number
    name: string
    email: string  
  }
  inviteTokens?: Array<{
    id: string
    token: string
    email?: string
    expiresAt: string
  }>
  _count: {
    vpnKeys: number
    inviteTokens: number
  }
}

const VpnClientsPage: React.FC = () => {
  const { user } = useAuthStore()
  const [clients, setClients] = useState<VpnClient[]>([])
  const [unassociatedKeys, setUnassociatedKeys] = useState<UnassociatedKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<VpnClient | null>(null)
  const [inviteClient, setInviteClient] = useState<VpnClient | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    telegramId: '',
    notes: '',
    migrationStatus: '' as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | '',
    existingKeyId: '',
  })
  const [inviteData, setInviteData] = useState({
    email: '',
    expiresInDays: 7,
  })
  const [submitting, setSubmitting] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<any>(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await vpnClientsApi.getVpnClients()
      setClients(response.data.clients || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch VPN clients')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnassociatedKeys = async () => {
    try {
      const response = await vpnApi.getUnassociatedKeys()
      setUnassociatedKeys(response.data.keys || [])
    } catch (err: any) {
      console.error('Failed to fetch unassociated keys:', err)
      // Don't show error for this, it's not critical
    }
  }

  const handleCreateClient = async () => {
    if (!formData.name) {
      setError('Name is required')
      return
    }

    try {
      setSubmitting(true)
      await vpnClientsApi.createVpnClient(
        formData.name,
        formData.phone || undefined,
        formData.telegramId || undefined,
        formData.notes || undefined,
        formData.migrationStatus || undefined,
        formData.existingKeyId || undefined
      )
      setCreateDialogOpen(false)
      setFormData({ name: '', phone: '', telegramId: '', notes: '', migrationStatus: '', existingKeyId: '' })
      await fetchUnassociatedKeys() // Refresh unassociated keys
      await fetchClients()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create VPN client')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClient = async () => {
    if (!editingClient || !formData.name) {
      setError('Name is required')
      return
    }

    try {
      setSubmitting(true)
      const updates: any = {
        name: formData.name,
        phone: formData.phone || undefined,
        telegramId: formData.telegramId || undefined,
        notes: formData.notes || undefined,
        migrationStatus: formData.migrationStatus || undefined,
      }

      await vpnClientsApi.updateVpnClient(editingClient.id, updates)
      setEditDialogOpen(false)
      setEditingClient(null)
      setFormData({ name: '', phone: '', telegramId: '', notes: '', migrationStatus: '', existingKeyId: '' })
      await fetchClients()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update VPN client')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClient = async (clientId: number, clientName: string) => {
    // Find the client to check VPN key count
    const client = clients.find(c => c.id === clientId);
    const keyCount = client?._count?.vpnKeys || 0;
    
    const confirmMessage = keyCount > 0 
      ? `Are you sure you want to delete VPN client "${clientName}"?\n\n${keyCount} VPN key(s) will become unassigned but will continue to work.`
      : `Are you sure you want to delete VPN client "${clientName}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      await vpnClientsApi.deleteVpnClient(clientId)
      await fetchClients()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete VPN client')
    }
  }

  const handleCreateInvite = async () => {
    if (!inviteClient) return

    try {
      setSubmitting(true)
      const response = await invitesApi.createInvite(
        inviteClient.id,
        inviteData.email || undefined,
        inviteData.expiresInDays
      )
      setCreatedInvite(response.data.invite)
      await fetchClients() // Refresh to show new invite
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create invite')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateVpnKey = async (clientId: number, clientName: string) => {
    try {
      await vpnApi.createKey(clientName, clientId)
      await fetchClients() // Refresh to show new key count
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create VPN key')
    }
  }

  const openEditDialog = (client: VpnClient) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      phone: client.phone || '',
      telegramId: client.telegramId || '',
      notes: client.notes || '',
      migrationStatus: client.migrationStatus || '',
      existingKeyId: '',
    })
    setEditDialogOpen(true)
  }

  const openInviteDialog = (client: VpnClient) => {
    setInviteClient(client)
    setInviteData({ email: '', expiresInDays: 7 })
    setCreatedInvite(null)
    setInviteDialogOpen(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchClients()
      fetchUnassociatedKeys()
    }
  }, [user])

  // Refresh unassociated keys when create dialog opens
  useEffect(() => {
    if (createDialogOpen && user?.role === 'ADMIN') {
      fetchUnassociatedKeys()
    }
  }, [createDialogOpen, user])

  if (user?.role !== 'ADMIN') {
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
        <Box>
          <Typography variant="h4" component="h1">
            VPN Clients ({clients.length})
          </Typography>
          {unassociatedKeys.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {unassociatedKeys.length} unassociated keys available from Outline server
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add VPN Client
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>VPN Keys</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {client.name}
                      </Typography>
                      {client.notes && (
                        <Typography variant="body2" color="text.secondary">
                          {client.notes}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {client.phone && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2">{client.phone}</Typography>
                      </Box>
                    )}
                    {client.telegramId && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Telegram fontSize="small" color="action" />
                        <Typography variant="body2">{client.telegramId}</Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {client.migratedUser ? (
                      <Chip
                        label="Migrated"
                        color="success"
                        size="small"
                        title={`Migrated to ${client.migratedUser.email}`}
                      />
                    ) : client.migrationStatus ? (
                      <Chip
                        label={client.migrationStatus}
                        color={
                          client.migrationStatus === 'COMPLETED' ? 'success' :
                          client.migrationStatus === 'IN_PROGRESS' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    ) : (
                      <Chip label="Active" color="primary" size="small" />
                    )}
                    {client.inviteTokens && client.inviteTokens.length > 0 && (
                      <Chip
                        label={`${client.inviteTokens.length} invite(s)`}
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <VpnKey fontSize="small" color="action" />
                    <Typography variant="body2">
                      {client._count.vpnKeys} key(s)
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DateRange fontSize="small" color="action" />
                    <Typography variant="body2">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Create VPN key">
                    <IconButton
                      color="primary"
                      onClick={() => handleCreateVpnKey(client.id, client.name)}
                      disabled={!!client.migratedUser}
                    >
                      <VpnKey />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Create invite">
                    <IconButton
                      color="info"
                      onClick={() => openInviteDialog(client)}
                      disabled={!!client.migratedUser}
                    >
                      <LinkIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit client">
                    <IconButton
                      color="primary"
                      onClick={() => openEditDialog(client)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={
                    client._count.vpnKeys > 0 
                      ? `Delete client (${client._count.vpnKeys} keys will become unassigned)`
                      : "Delete client"
                  }>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Client Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New VPN Client</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Telegram ID"
              fullWidth
              value={formData.telegramId}
              onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Migration Status (optional)</InputLabel>
              <Select
                value={formData.migrationStatus}
                label="Migration Status (optional)"
                onChange={(e) => setFormData({ ...formData, migrationStatus: e.target.value as any })}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </Select>
            </FormControl>
            {unassociatedKeys.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Associate Existing VPN Key (optional)</InputLabel>
                <Select
                  value={formData.existingKeyId}
                  label="Associate Existing VPN Key (optional)"
                  onChange={(e) => setFormData({ ...formData, existingKeyId: e.target.value })}
                >
                  <MenuItem value="">Create new key later</MenuItem>
                  {unassociatedKeys.map((key) => (
                    <MenuItem key={key.id} value={key.id}>
                      Key #{key.id} {key.name && `- ${key.name}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateClient}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit VPN Client</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Telegram ID"
              fullWidth
              value={formData.telegramId}
              onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Migration Status</InputLabel>
              <Select
                value={formData.migrationStatus}
                label="Migration Status"
                onChange={(e) => setFormData({ ...formData, migrationStatus: e.target.value as any })}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditClient}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Invite Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create Migration Invite for {inviteClient?.name}
        </DialogTitle>
        <DialogContent>
          {!createdInvite ? (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Email (optional)"
                fullWidth
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                helperText="If provided, invite will be sent to this email"
              />
              <TextField
                label="Expires in days"
                fullWidth
                type="number"
                value={inviteData.expiresInDays}
                onChange={(e) => setInviteData({ ...inviteData, expiresInDays: parseInt(e.target.value) || 7 })}
              />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Alert severity="success">
                Invite created successfully!
              </Alert>
              <TextField
                label="Invite URL"
                fullWidth
                value={createdInvite.inviteUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => copyToClipboard(createdInvite.inviteUrl)}>
                      <ContentCopy />
                    </IconButton>
                  ),
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Expires: {new Date(createdInvite.expiresAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>
            {createdInvite ? 'Close' : 'Cancel'}
          </Button>
          {!createdInvite && (
            <Button
              onClick={handleCreateInvite}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={20} /> : 'Create Invite'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VpnClientsPage