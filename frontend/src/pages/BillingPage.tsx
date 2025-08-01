import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Stack } from '@mui/material';
import { BillingCard } from '../components/billing/BillingCard';
import { BillingStatsCard } from '../components/billing/BillingStatsCard';
import { BalanceManagementForm } from '../components/billing/BalanceManagementForm';
import { UsersTable } from '../components/billing/UsersTable';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface BillingData {
  billing?: any;
  users?: any[];
  stats?: any;
  settings: {
    monthlyCost: number;
    currencyName: string;
  };
}

export const BillingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (user?.role === 'ADMIN') {
        const [usersResponse, statsResponse] = await Promise.all([
          api.get('/billing/admin/users'),
          api.get('/billing/admin/stats')
        ]);
        
        setData({
          users: usersResponse.data.users,
          stats: statsResponse.data.stats,
          settings: usersResponse.data.settings
        });
      } else {
        const response = await api.get('/billing/user');
        setData({
          billing: response.data.billing,
          settings: response.data.settings
        });
      }
    } catch (error: any) {
      console.error('Error fetching billing data:', error);
      setError(error?.response?.data?.error || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async (userId: number, amount: number, description?: string) => {
    setProcessing(true);
    try {
      await api.post(`/billing/admin/users/${userId}/balance`, {
        amount,
        description
      });
      await fetchData();
    } finally {
      setProcessing(false);
    }
  };

  const handleSetBalance = async (userId: number, balance: number, description?: string) => {
    setProcessing(true);
    try {
      await api.post(`/billing/admin/users/${userId}/balance/set`, {
        balance,
        description
      });
      await fetchData();
    } finally {
      setProcessing(false);
    }
  };

  const handleDeductBalance = async (userId: number, amount: number, description?: string) => {
    setProcessing(true);
    try {
      await api.post(`/billing/admin/users/${userId}/balance/deduct`, {
        amount,
        description
      });
      await fetchData();
    } finally {
      setProcessing(false);
    }
  };

  const handleStartPaidSubscription = async (userId: number) => {
    setProcessing(true);
    try {
      await api.post(`/billing/admin/users/${userId}/start-paid`);
      await fetchData();
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessBilling = async () => {
    setProcessing(true);
    try {
      await api.post('/billing/admin/process');
      await fetchData();
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load billing data
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          {user?.role === 'ADMIN' ? 'Billing Management' : 'My Subscription'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {user?.role === 'ADMIN' 
            ? 'Manage user subscriptions and balances'
            : 'View your subscription information and balance'
          }
        </Typography>
      </Box>

      {user?.role === 'ADMIN' && data.users && data.stats ? (
        <Stack spacing={3}>
          <BillingStatsCard
            stats={data.stats}
            currencyName={data.settings.currencyName}
            onProcessBilling={handleProcessBilling}
            onRefresh={fetchData}
            isProcessing={processing}
          />
          
          <BalanceManagementForm
            users={data.users}
            onAddBalance={handleAddBalance}
            onSetBalance={handleSetBalance}
            onDeductBalance={handleDeductBalance}
            isProcessing={processing}
          />
          
          <UsersTable
            users={data.users}
            currencyName={data.settings.currencyName}
            onStartPaidSubscription={handleStartPaidSubscription}
            isProcessing={processing}
          />
        </Stack>
      ) : (
        data.billing && (
          <BillingCard
            billing={data.billing}
            settings={data.settings}
            onRefresh={fetchData}
          />
        )
      )}
    </Container>
  );
};