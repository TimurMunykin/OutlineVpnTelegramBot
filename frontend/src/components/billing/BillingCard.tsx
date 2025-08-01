import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Alert,
  IconButton,
} from '@mui/material';
import { Refresh as RefreshIcon, Warning as WarningIcon } from '@mui/icons-material';

interface BillingInfo {
  id: number;
  name: string;
  email: string;
  subscriptionType: 'FREE' | 'PAID';
  balance: number;
  subscriptionStatus: 'ACTIVE' | 'INSUFFICIENT_BALANCE';
  subscriptionStartDate?: string;
  nextBillingDate?: string;
  remainingDays?: number;
  canAffordNextMonth: boolean;
}

interface BillingSettings {
  monthlyCost: number;
  currencyName: string;
}

interface BillingCardProps {
  billing: BillingInfo;
  settings: BillingSettings;
  onRefresh?: () => void;
}

export const BillingCard: React.FC<BillingCardProps> = ({ billing, settings, onRefresh }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INSUFFICIENT_BALANCE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSubscriptionTypeColor = (type: string) => {
    switch (type) {
      case 'FREE':
        return 'info';
      case 'PAID':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Subscription Information</Typography>
          {onRefresh && (
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Subscription Type
              </Typography>
              <Chip
                label={billing.subscriptionType === 'FREE' ? 'Free' : 'Paid'}
                color={getSubscriptionTypeColor(billing.subscriptionType) as any}
                size="small"
              />
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <Chip
                label={billing.subscriptionStatus === 'ACTIVE' ? 'Active' : 'Blocked'}
                color={getStatusColor(billing.subscriptionStatus) as any}
                size="small"
              />
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Balance
              </Typography>
              <Typography
                variant="h6"
                color={billing.balance > 0 ? 'success.main' : 'error.main'}
              >
                {billing.balance} {settings.currencyName}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            {billing.subscriptionType === 'PAID' && (
              <>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Subscription Start
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(billing.subscriptionStartDate)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Next Billing
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(billing.nextBillingDate)}
                  </Typography>
                </Box>

                {billing.remainingDays !== undefined && (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Days Until Billing
                    </Typography>
                    <Typography variant="body2">
                      {billing.remainingDays > 0 ? `${billing.remainingDays} days` : 'Overdue'}
                    </Typography>
                  </Box>
                )}
              </>
            )}

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Monthly Cost
              </Typography>
              <Typography variant="body2">
                {settings.monthlyCost} {settings.currencyName}/month
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {billing.subscriptionType === 'PAID' && !billing.canAffordNextMonth && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              Insufficient funds for next billing
            </Typography>
            <Typography variant="body2">
              Please top up your balance by {settings.monthlyCost - billing.balance} {settings.currencyName} to continue your subscription.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};