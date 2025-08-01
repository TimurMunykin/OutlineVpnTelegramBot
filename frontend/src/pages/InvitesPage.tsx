import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material'
import { 
  Delete, 
  ContentCopy,
  DateRange,
  Person,
  Email,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { invitesApi } from '../services/api'

interface Invite {
  id: string
  token: string
  email?: string
  expiresAt: string
  isUsed: boolean
  usedAt?: string
  createdAt: string
  vpnClient: {
    id: number
    name: string
  }
  usedBy?: {
    id: number
    name: string
    email: string
  }
}

const InvitesPage: React.FC = () => {
  const { user } = useAuthStore()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvites = async () => {
    try {
      setLoading(true)
      const response = await invitesApi.getInvites()
      setInvites(response.data.invites || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch invites')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    if (!window.confirm('Are you sure you want to delete this invite?')) {
      return
    }

    try {
      await invitesApi.deleteInvite(inviteId)
      await fetchInvites()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete invite')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getInviteUrl = (token: string) => {
    return `${window.location.origin}/invite/${token}`
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchInvites()
    }
  }, [user])

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
      <Typography variant="h4" component="h1" gutterBottom>
        Migration Invites ({invites.length})
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>VPN Client</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Used By</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2">
                      {invite.vpnClient.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {invite.email ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{invite.email}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No email
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      invite.isUsed 
                        ? 'Used' 
                        : new Date(invite.expiresAt) < new Date() 
                          ? 'Expired' 
                          : 'Active'
                    }
                    color={
                      invite.isUsed 
                        ? 'success' 
                        : new Date(invite.expiresAt) < new Date() 
                          ? 'error' 
                          : 'primary'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DateRange fontSize="small" color="action" />
                    <Typography variant="body2">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {invite.usedBy ? (
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {invite.usedBy.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invite.usedBy.email}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not used
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DateRange fontSize="small" color="action" />
                    <Typography variant="body2">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {!invite.isUsed && new Date(invite.expiresAt) >= new Date() && (
                    <Tooltip title="Copy invite URL">
                      <IconButton
                        color="primary"
                        onClick={() => copyToClipboard(getInviteUrl(invite.token))}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                  )}
                  {!invite.isUsed && (
                    <Tooltip title="Delete invite">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteInvite(invite.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {invites.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No invites created yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create invites from the VPN Clients page
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default InvitesPage