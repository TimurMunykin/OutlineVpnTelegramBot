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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AddBalanceFormProps {
  users: User[];
  onAddBalance: (userId: number, amount: number, description?: string) => Promise<void>;
  isProcessing: boolean;
}

export const AddBalanceForm: React.FC<AddBalanceFormProps> = ({
  users,
  onAddBalance,
  isProcessing,
}) => {
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = async () => {
    if (!selectedUser || !amount) return;
    
    const amountNum = parseInt(amount);
    if (amountNum <= 0) return;

    try {
      await onAddBalance(selectedUser as number, amountNum, description || undefined);
      setAmount('');
      setDescription('');
      setSelectedUser('');
    } catch (error) {
      console.error('Error adding balance:', error);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Balance Management
        </Typography>
        
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
                    {user.name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: 1 }}
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
              color="success"
              startIcon={<AddIcon />}
              onClick={handleSubmit}
              disabled={!selectedUser || !amount || isProcessing}
            >
              Add Balance
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};