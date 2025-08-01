import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  TextField,
  Switch,
  IconButton,
  Button,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';

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

interface UserLimitRowProps {
  user: UserLimit;
  onUpdate: (userId: number, data: { maxVpnKeys: number; canCreateKeys: boolean }) => Promise<void>;
  onDelete: (userId: number) => Promise<void>;
}

export default function UserLimitRow({ user, onUpdate, onDelete }: UserLimitRowProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    maxVpnKeys: user.maxVpnKeys,
    canCreateKeys: user.canCreateKeys,
  });

  const handleSave = async () => {
    await onUpdate(user.id, formData);
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      maxVpnKeys: user.maxVpnKeys,
      canCreateKeys: user.canCreateKeys,
    });
    setEditing(false);
  };

  return (
    <TableRow>
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
          label={user.role} 
          size="small" 
          color={user.role === 'ADMIN' ? 'primary' : 'default'} 
        />
      </TableCell>
      <TableCell>{user.currentKeyCount}</TableCell>
      <TableCell>
        {editing ? (
          <TextField
            type="number"
            size="small"
            value={formData.maxVpnKeys}
            onChange={(e) => setFormData({
              ...formData,
              maxVpnKeys: parseInt(e.target.value) || 0
            })}
            inputProps={{ min: 0, max: 100 }}
            sx={{ width: 80 }}
          />
        ) : (
          user.maxVpnKeys
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Switch
            checked={formData.canCreateKeys}
            onChange={(e) => setFormData({
              ...formData,
              canCreateKeys: e.target.checked
            })}
            size="small"
          />
        ) : (
          <Switch checked={user.canCreateKeys} disabled size="small" />
        )}
      </TableCell>
      <TableCell>
        <Chip 
          label={user.isOverridden ? 'Custom' : 'Default'} 
          size="small" 
          color={user.isOverridden ? 'secondary' : 'default'} 
        />
      </TableCell>
      <TableCell>
        {editing ? (
          <Box display="flex" gap={1}>
            <IconButton size="small" onClick={handleSave} color="primary">
              <SaveIcon />
            </IconButton>
            <IconButton size="small" onClick={handleCancel}>
              <CancelIcon />
            </IconButton>
          </Box>
        ) : (
          <Box display="flex" gap={1}>
            <IconButton size="small" onClick={() => setEditing(true)}>
              <EditIcon />
            </IconButton>
            {user.isOverridden && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => onDelete(user.id)}
              >
                Reset
              </Button>
            )}
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}