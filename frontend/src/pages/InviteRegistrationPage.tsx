import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import {
  Person,
  VpnKey,
  CheckCircle,
  Error,
} from '@mui/icons-material'
import { invitesApi, authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

interface InviteInfo {
  id: string
  email?: string
  vpnClient: {
    id: number
    name: string
    vpnKeysCount: number
  }
  expiresAt: string
}

const InviteRegistrationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  })

  const validateInvite = async () => {
    if (!token) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    try {
      const response = await invitesApi.validateInvite(token)
      setInviteInfo(response.data.invite)
      
      // Pre-fill email if provided in invite
      if (response.data.invite.email) {
        setFormData(prev => ({ ...prev, email: response.data.invite.email }))
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired invite')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token || !inviteInfo) {
      setError('Invalid invite')
      return
    }

    // Validation
    if (!formData.email || !formData.name || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Use the invite to register
      await invitesApi.useInvite(token, formData.email, formData.name, formData.password)
      
      setSuccess(true)
      
      // Auto-login after successful registration
      setTimeout(async () => {
        try {
          const loginResponse = await authApi.login(formData.email, formData.password)
          login(loginResponse.data.user, loginResponse.data.token, loginResponse.data.refreshToken)
          navigate('/')
        } catch (loginError) {
          console.error('Auto-login failed:', loginError)
          navigate('/login')
        }
      }, 2000)

    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    validateInvite()
  }, [token])

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" color="white">
          Validating invite...
        </Typography>
      </Box>
    )
  }

  if (error && !inviteInfo) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 3 }}
      >
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Invalid Invite
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (success) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 3 }}
      >
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Registration Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your account has been created and your VPN access has been migrated.
              Redirecting to dashboard...
            </Typography>
            <CircularProgress size={24} />
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 3 }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          borderRadius: 3,
        }}
      >
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            Welcome!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You've been invited to join VPN Manager
          </Typography>
        </Box>

        {inviteInfo && (
          <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Person color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {inviteInfo.vpnClient.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  VPN Client Migration
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <VpnKey fontSize="small" color="action" />
              <Typography variant="body2">
                {inviteInfo.vpnClient.vpnKeysCount} VPN key(s) will be transferred to your account
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Expires: {new Date(inviteInfo.expiresAt).toLocaleDateString()}
              </Typography>
              <Chip label="Valid" color="success" size="small" />
            </Box>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!inviteInfo?.email} // Disable if email was provided in invite
            />
            
            <TextField
              label="Full Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
            />
            
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Minimum 6 characters"
            />
            
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ mt: 2, py: 1.5 }}
            >
              {submitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </Box>
        </form>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none' }}
            >
              Sign in
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default InviteRegistrationPage