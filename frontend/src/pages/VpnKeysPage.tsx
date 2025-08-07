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
import { Add, Delete, ContentCopy, Info, Person, PersonAdd, Refresh } from '@mui/icons-material'
import { vpnApi } from '../services/api'
import { useAuthStore } from '@/stores/authStore'
import TrafficUsageCard from '../components/TrafficUsageCard'
import { useTranslation } from 'react-i18next'

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
    role: string
  }
  vpnClient?: {
    id: number
    name: string
    phone?: string
    migrationStatus?: string
  }
  // Traffic data fields
  trafficUsageBytes?: number
  trafficLimitBytes?: number | null
  trafficUsageMB?: number
  trafficLimitMB?: number | null
  usagePercentage?: number
  isOverLimit?: boolean
}

const VpnKeysPage: React.FC = () => {
  const { user, token } = useAuthStore()
  const { t } = useTranslation()
  const [keys, setKeys] = useState<VpnKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [canCreateKeys, setCanCreateKeys] = useState(false)
  const [userLimits, setUserLimits] = useState<{
    currentCount: number
    maxAllowed: number
    canCreate: boolean
    reason?: string
  } | null>(null)
  const [refreshingTraffic, setRefreshingTraffic] = useState(false)

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const response = await vpnApi.getKeysWithTraffic()
      setKeys(response.data.keys || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToLoadBillingData'))
    } finally {
      setLoading(false)
    }
  }

  const refreshTrafficData = async () => {
    try {
      setRefreshingTraffic(true)
      const response = await vpnApi.getKeysWithTraffic()
      setKeys(response.data.keys || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.serverError'))
    } finally {
      setRefreshingTraffic(false)
    }
  }

  const checkUserLimits = async () => {
    // Админы всегда могут создавать ключи
    if (user?.role === 'ADMIN') {
      setCanCreateKeys(true)
      return
    }

    try {
      const response = await fetch('/api/vpn/can-create-key', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (data.canCreate) {
        setCanCreateKeys(true)
      } else {
        setCanCreateKeys(false)
        setUserLimits({
          currentCount: data.currentCount || 0,
          maxAllowed: data.maxAllowed || 0,
          canCreate: false,
          reason: data.reason || 'Cannot create keys'
        })
      }
    } catch (err) {
      // В случае ошибки запрещаем создание ключей
      setCanCreateKeys(false)
    }
  }

  const handleCreateKey = async () => {
    try {
      setCreating(true)
      await vpnApi.createKey(newKeyName || undefined)
      setCreateDialogOpen(false)
      setNewKeyName('')
      await fetchKeys()
      await checkUserLimits() // Перепроверяем лимиты после создания ключа
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.serverError'))
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (keyId: number) => {
    if (!window.confirm(t('common.confirm') + '?')) {
      return
    }

    try {
      await vpnApi.deleteKey(keyId.toString())
      await fetchKeys()
      await checkUserLimits() // Перепроверяем лимиты после удаления ключа
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.serverError'))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  useEffect(() => {
    fetchKeys()
    checkUserLimits()
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
          {t('vpnKeys.title')}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={refreshingTraffic ? <CircularProgress size={16} /> : <Refresh />}
            onClick={refreshTrafficData}
            disabled={refreshingTraffic}
          >
            {t('common.refresh')}
          </Button>
          {canCreateKeys && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              {t('vpnKeys.createKey')}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!canCreateKeys && userLimits && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {userLimits.reason} (Current: {userLimits.currentCount}/{userLimits.maxAllowed} keys)
        </Alert>
      )}

      {keys.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            {t('vpnKeys.noKeysFound')}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('vpnKeys.keyName')}</TableCell>
                <TableCell>{t('vpnKeys.accessUrl')}</TableCell>
                {user?.role === 'ADMIN' && (
                  <>
                    <TableCell>{t('vpnKeys.owner')}</TableCell>
                    <TableCell>{t('vpnKeys.type')}</TableCell>
                  </>
                )}
                <TableCell>{t('vpnKeys.trafficUsed')}</TableCell>
                <TableCell>{t('vpnKeys.createdAt')}</TableCell>
                <TableCell align="right">{t('vpnKeys.actions')}</TableCell>
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
                  {user?.role === 'ADMIN' && (
                    <>
                      <TableCell>
                        {key.user ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person fontSize="small" color="primary" />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {key.user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {key.user.email}
                              </Typography>
                            </Box>
                          </Box>
                        ) : key.vpnClient ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PersonAdd fontSize="small" color="secondary" />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {key.vpnClient.name}
                              </Typography>
                              {key.vpnClient.phone && (
                                <Typography variant="caption" color="text.secondary">
                                  {key.vpnClient.phone}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {key.user ? (
                          <Chip
                            label={`Web User (${key.user.role})`}
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        ) : key.vpnClient ? (
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            <Chip
                              label="VPN Client"
                              color="secondary"
                              size="small"
                              variant="outlined"
                            />
                            {key.vpnClient.migrationStatus && (
                              <Chip
                                label={key.vpnClient.migrationStatus}
                                color={
                                  key.vpnClient.migrationStatus === 'COMPLETED' ? 'success' :
                                  key.vpnClient.migrationStatus === 'IN_PROGRESS' ? 'warning' : 'default'
                                }
                                size="small"
                              />
                            )}
                          </Box>
                        ) : (
                          <Chip
                            label="Unassigned"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    {key.trafficUsageMB !== undefined ? (
                      <TrafficUsageCard
                        trafficUsageMB={key.trafficUsageMB}
                        trafficLimitMB={key.trafficLimitMB}
                        usagePercentage={key.usagePercentage || 0}
                        isOverLimit={key.isOverLimit || false}
                        compact
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Loading...
                      </Typography>
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
        <DialogTitle>{t('vpnKeys.createKey')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('vpnKeys.keyName') + ' (optional)'}
            fullWidth
            variant="outlined"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="My VPN Key"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleCreateKey}
            variant="contained"
            disabled={creating}
          >
            {creating ? <CircularProgress size={20} /> : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VpnKeysPage