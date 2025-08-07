import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import { PlayArrow as PlayIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface BillingStats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalBalance: number;
  monthlyRevenue: number;
  usersWithLowBalance: number;
}

interface BillingStatsCardProps {
  stats: BillingStats;
  currencyName: string;
  onProcessBilling: () => void;
  onRefresh: () => void;
  isProcessing: boolean;
}

export const BillingStatsCard: React.FC<BillingStatsCardProps> = ({
  stats,
  currencyName,
  onProcessBilling,
  onRefresh,
  isProcessing,
}) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">{t('billing.billingStatistics')}</Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <PlayIcon />}
              onClick={onProcessBilling}
              disabled={isProcessing}
            >
              {isProcessing ? t('common.loading') : t('billing.processBilling')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
            >
              {t('common.refresh')}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {stats.totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('billing.stats.totalUsers')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="secondary.main">
                {stats.paidUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('billing.stats.paidUsers')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.blockedUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('billing.stats.blockedUsers')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.totalBalance}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('billing.stats.totalBalance')} ({currencyName})
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};