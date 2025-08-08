import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Edit as EditIcon } from '@mui/icons-material';

interface User {
  id: number;
  name: string;
  email: string;
  balance: number;
}

interface BalanceManagementFormProps {
  users: User[];
  onAddBalance: (userId: number, amount: number, description?: string) => Promise<void>;
  onSetBalance: (userId: number, balance: number, description?: string) => Promise<void>;
  onDeductBalance: (userId: number, amount: number, description?: string) => Promise<void>;
  isProcessing: boolean;
}

export const BalanceManagementForm: React.FC<BalanceManagementFormProps> = ({
  users,
  onAddBalance,
  onSetBalance,
  onDeductBalance,
  isProcessing,
}) => {
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);

  const selectedUserData = users.find(u => u.id === selectedUser);

  const handleSubmit = async () => {
    if (!selectedUser || !amount) return;
    
    const amountNum = parseInt(amount);
    if (amountNum < 0) return;

    try {
      switch (activeTab) {
        case 0: // Add
          if (amountNum <= 0) return;
          await onAddBalance(selectedUser as number, amountNum, description || undefined);
          break;
        case 1: // Set
          await onSetBalance(selectedUser as number, amountNum, description || undefined);
          break;
        case 2: // Deduct
          if (amountNum <= 0) return;
          await onDeductBalance(selectedUser as number, amountNum, description || undefined);
          break;
      }
      
      setAmount('');
      setDescription('');
      setSelectedUser('');
    } catch (error) {
      console.error('Error managing balance:', error);
    }
  };

  const getButtonConfig = () => {
    switch (activeTab) {
      case 0:
        return { 
          label: 'Add Balance', 
          icon: <AddIcon />, 
          color: 'success' as const,
          disabled: !selectedUser || !amount || parseInt(amount) <= 0 || isProcessing
        };
      case 1:
        return { 
          label: 'Set Balance', 
          icon: <EditIcon />, 
          color: 'primary' as const,
          disabled: !selectedUser || amount === '' || parseInt(amount) < 0 || isProcessing
        };
      case 2:
        return { 
          label: 'Deduct Balance', 
          icon: <RemoveIcon />, 
          color: 'error' as const,
          disabled: !selectedUser || !amount || parseInt(amount) <= 0 || isProcessing
        };
      default:
        return { label: 'Submit', icon: null, color: 'primary' as const, disabled: true };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Balance Management
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Add Balance" />
            <Tab label="Set Balance" />
            <Tab label="Deduct Balance" />
          </Tabs>
        </Box>
        
        <Grid container spacing={3} alignItems="end">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>User</InputLabel>
              <Select
                value={selectedUser}
                label="User"
                onChange={(e) => setSelectedUser(e.target.value as number)}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.balance} pts)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedUserData && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Current balance: {selectedUserData.balance} points
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={activeTab === 1 ? "New Balance" : "Amount"}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: activeTab === 1 ? 0 : 1 }}
              helperText={
                activeTab === 1 ? "Set to exact amount" : 
                activeTab === 0 ? "Amount to add" : "Amount to deduct"
              }
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color={buttonConfig.color}
              startIcon={buttonConfig.icon}
              onClick={handleSubmit}
              disabled={buttonConfig.disabled}
            >
              {buttonConfig.label}
            </Button>
          </Grid>
        </Grid>

        {activeTab === 2 && selectedUserData && parseInt(amount) > selectedUserData.balance && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.contrastText">
              Warning: Deducting {amount} points will result in negative balance ({selectedUserData.balance - parseInt(amount)} points)
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};