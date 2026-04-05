import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import api from '../../services/api';

const AddTeamMemberDialog = ({ open, onClose, onMemberAdded }) => {
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddMember = async () => {
    if (!memberName.trim()) {
      setError('Please enter a team member name');
      return;
    }

    if (!memberEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(memberEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/team', {
        name: memberName.trim(),
        email: memberEmail.trim(),
      });

      setSuccess(`Team member "${response.data.name}" added successfully!`);
      setMemberName('');
      setMemberEmail('');

      // Wait a moment for the user to see the success message
      setTimeout(() => {
        onMemberAdded();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error adding team member:', err);
      const errorMessage = err.response?.data?.error || 'Failed to add team member. Please try again.';
      
      // Handle duplicate email error
      if (err.response?.status === 409 || errorMessage.includes('duplicate')) {
        setError('This email address is already in use. Please use a different email.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMemberName('');
    setMemberEmail('');
    setError('');
    setSuccess('');
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAddMember();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Team Member</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Full Name"
            type="text"
            fullWidth
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter team member's full name"
            disabled={loading}
            variant="outlined"
          />
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter team member's email"
            disabled={loading}
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleAddMember}
          variant="contained"
          color="primary"
          disabled={loading || !memberName.trim() || !memberEmail.trim()}
          sx={{ position: 'relative' }}
        >
          {loading ? (
            <>
              <CircularProgress
                size={20}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  marginLeft: '-10px',
                }}
              />
              <span style={{ visibility: 'hidden' }}>Add Member</span>
            </>
          ) : (
            'Add Member'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTeamMemberDialog;
