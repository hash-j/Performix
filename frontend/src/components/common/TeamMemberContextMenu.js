import React, { useState, useEffect, useContext } from 'react';
import {
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const TeamMemberContextMenu = ({ 
  open, 
  anchorEl, 
  onClose, 
  member, 
  onMemberUpdated,
  onMemberDeleted 
}) => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [displayMember, setDisplayMember] = useState(null);

  // Sync member data whenever it changes
  useEffect(() => {
    if (member) {
      setDisplayMember(member);
      setEditName(member.name || '');
      setEditEmail(member.email || '');
    }
  }, [member]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEdit = () => {
    setError('');
    setSuccess('');
    onClose();
    setEditDialogOpen(true);
  };

  const handleInfo = () => {
    onClose();
    setInfoDialogOpen(true);
  };

  const handleDelete = () => {
    onClose();
    setDeleteConfirmOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setError('Member name cannot be empty');
      return;
    }

    if (!editEmail.trim()) {
      setError('Email cannot be empty');
      return;
    }

    if (!validateEmail(editEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/team/${displayMember.id}`, { 
        name: editName.trim(),
        email: editEmail.trim()
      });
      console.log('Update response:', response.data);
      setSuccess('Team member updated successfully!');
      setTimeout(() => {
        setEditDialogOpen(false);
        setError('');
        setSuccess('');
        onMemberUpdated();
      }, 1000);
    } catch (err) {
      console.error('Error updating team member:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to update team member';
      if (err.response?.status === 409 || errorMsg.includes('duplicate')) {
        setError('This email address is already in use.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.delete(`/team/${displayMember.id}`);
      console.log('Delete response:', response.data);
      setDeleteConfirmOpen(false);
      setTimeout(() => {
        onMemberDeleted();
      }, 500);
    } catch (err) {
      console.error('Error deleting team member:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete team member';
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open && canEdit}
        onClose={onClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      >
        <MenuItem onClick={handleEdit} sx={{ gap: 1 }}>
          <EditIcon fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ gap: 1, color: 'error.main' }}>
          <DeleteIcon fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Team Member</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Team Member Information</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {displayMember?.name || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Email
              </Typography>
              <Typography variant="body1">
                {displayMember?.email || 'N/A'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>
            Are you sure you want to delete team member <strong>{displayMember?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TeamMemberContextMenu;
