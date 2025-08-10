import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Box,
} from '@mui/material';
import { PlayArrow as StartIcon } from '@mui/icons-material';

interface User {
  id: number;
  name: string;
  email: string;
  subscriptionType: 'FREE' | 'PAID';
  balance: number;
  subscriptionStatus: 'ACTIVE' | 'INSUFFICIENT_BALANCE';
  canAffordNextMonth: boolean;
}

interface UsersTableProps {
  users: User[];
  currencyName: string;
  onStartPaidSubscription: (userId: number) => Promise<void>;
  isProcessing: boolean;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  currencyName,
  onStartPaidSubscription,
  isProcessing,
}) => {
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

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Users
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Subscription Type</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.subscriptionType === 'FREE' ? 'Free' : 'Paid'}
                      color={getSubscriptionTypeColor(user.subscriptionType) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        color={user.balance > 0 ? 'success.main' : 'error.main'}
                        fontWeight="medium"
                      >
                        {user.balance} {currencyName}
                      </Typography>
                      {user.subscriptionType === 'PAID' && !user.canAffordNextMonth && (
                        <Typography variant="caption" color="error.main">
                          Insufficient funds
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.subscriptionStatus === 'ACTIVE' ? 'Active' : 'Blocked'}
                      color={getStatusColor(user.subscriptionStatus) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.subscriptionType === 'FREE' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<StartIcon />}
                        onClick={() => onStartPaidSubscription(user.id)}
                        disabled={isProcessing}
                      >
                        Start Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};