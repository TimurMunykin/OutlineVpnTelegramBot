import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import UserLimitRow from './UserLimitRow';

interface UserLimit {
  id: number;
  name: string;
  email: string;
  role: string;
  currentKeyCount: number;
  maxVpnKeys: number;
  canCreateKeys: boolean;
  isOverridden: boolean;
}

interface UserLimitsTabProps {
  userLimits: UserLimit[];
  onUpdateUserLimit: (userId: number, data: { maxVpnKeys: number; canCreateKeys: boolean }) => Promise<void>;
  onDeleteUserLimit: (userId: number) => Promise<void>;
}

export default function UserLimitsTab({ 
  userLimits, 
  onUpdateUserLimit, 
  onDeleteUserLimit 
}: UserLimitsTabProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        User VPN Key Limits
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Override global defaults for individual users. Users without overrides will use global settings.
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Current Keys</TableCell>
              <TableCell>Max Keys</TableCell>
              <TableCell>Can Create</TableCell>
              <TableCell>Override</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userLimits.map((user) => (
              <UserLimitRow
                key={user.id}
                user={user}
                onUpdate={onUpdateUserLimit}
                onDelete={onDeleteUserLimit}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}