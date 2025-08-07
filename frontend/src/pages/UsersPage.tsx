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
  Switch,
  FormControlLabel,
} from '@mui/material'
import { 
  Add, 
  Delete, 
  Edit, 
  Person, 
  AdminPanelSettings,
  Email,
  DateRange,
  Web,
  VpnKey
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { usersApi } from '../services/api'
import { useTranslation } from 'react-i18next'

interface User {
  id: number
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  isEmailVerified: boolean
  hasWebAccess: boolean
  migrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  createdAt: string
  updatedAt: string
}

const UsersPage: React.FC = () => {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'ADMIN',
    hasWebAccess: true,
    migrationStatus: undefined as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | undefined,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getUsers()
      setUsers(response.data.users || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.serverError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Все поля обязательны')
      return
    }

    try {
      setSubmitting(true)
      const createData = {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: formData.role,
        hasWebAccess: formData.hasWebAccess,
        ...(formData.migrationStatus && { migrationStatus: formData.migrationStatus })
      }
      
      await usersApi.createUser(createData.email, createData.name, createData.password, createData.role, createData.hasWebAccess, createData.migrationStatus)
      setCreateDialogOpen(false)
      setFormData({ name: '', email: '', password: '', role: 'USER', hasWebAccess: true, migrationStatus: undefined })
      await fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.serverError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser || !formData.name || !formData.email) {
      setError('Имя и email обязательны')
      return
    }

    try {
      setSubmitting(true)
      const updates: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        hasWebAccess: formData.hasWebAccess,
        ...(formData.migrationStatus && { migrationStatus: formData.migrationStatus })
      }
      
      if (formData.password) {
        updates.password = formData.password
      }

      await usersApi.updateUser(editingUser.id, updates)
      setEditDialogOpen(false)
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: 'USER', hasWebAccess: true, migrationStatus: undefined })
      await fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return
    }

    try {
      await usersApi.deleteUser(userId)
      await fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user')
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      hasWebAccess: user.hasWebAccess,
      migrationStatus: user.migrationStatus,
    })
    setEditDialogOpen(true)
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers()
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Users ({users.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add User
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
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Access</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      {user.role === 'ADMIN' ? <AdminPanelSettings /> : <Person />}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === 'ADMIN' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    <Chip
                      icon={user.hasWebAccess ? <Web /> : <VpnKey />}
                      label={user.hasWebAccess ? 'Web + VPN' : 'VPN Only'}
                      color={user.hasWebAccess ? 'primary' : 'secondary'}
                      size="small"
                    />
                    {user.migrationStatus && (
                      <Chip
                        label={user.migrationStatus}
                        color={user.migrationStatus === 'COMPLETED' ? 'success' : user.migrationStatus === 'IN_PROGRESS' ? 'warning' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<Email />}
                    label={user.isEmailVerified ? 'Verified' : 'Pending'}
                    color={user.isEmailVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DateRange fontSize="small" color="action" />
                    <Typography variant="body2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => openEditDialog(user)}
                    title="Edit user"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    title="Delete user"
                    disabled={user.id === 1} // Can't delete admin
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
              >
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasWebAccess}
                  onChange={(e) => setFormData({ ...formData, hasWebAccess: e.target.checked })}
                />
              }
              label="Web Access (allows login to this dashboard)"
            />
            <FormControl fullWidth>
              <InputLabel>Migration Status (optional)</InputLabel>
              <Select
                value={formData.migrationStatus || ''}
                label="Migration Status (optional)"
                onChange={(e) => setFormData({ ...formData, migrationStatus: e.target.value as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | undefined || undefined })}
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
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="New Password (optional)"
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Leave empty to keep current password"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
              >
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasWebAccess}
                  onChange={(e) => setFormData({ ...formData, hasWebAccess: e.target.checked })}
                />
              }
              label="Web Access (allows login to this dashboard)"
            />
            <FormControl fullWidth>
              <InputLabel>Migration Status (optional)</InputLabel>
              <Select
                value={formData.migrationStatus || ''}
                label="Migration Status (optional)"
                onChange={(e) => setFormData({ ...formData, migrationStatus: e.target.value as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | undefined || undefined })}
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
            onClick={handleEditUser}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UsersPage