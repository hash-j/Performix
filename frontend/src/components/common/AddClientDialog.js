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

const AddClientDialog = ({ open, onClose, onClientAdded }) => {
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddClient = async () => {
    if (!clientName.trim()) {
      setError('Please enter a client name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/clients', {
        name: clientName.trim(),
      });

      setSuccess(`Client "${response.data.name}" added successfully!`);
      setClientName('');

      // Wait a moment for the user to see the success message
      setTimeout(() => {
        onClientAdded();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error adding client:', err);
      setError(err.response?.data?.error || 'Failed to add client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClientName('');
    setError('');
    setSuccess('');
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAddClient();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Client</DialogTitle>
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
            label="Client Name"
            type="text"
            fullWidth
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter the client's business name"
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
          onClick={handleAddClient}
          variant="contained"
          color="primary"
          disabled={loading || !clientName.trim()}
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
              <span style={{ visibility: 'hidden' }}>Add Client</span>
            </>
          ) : (
            'Add Client'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClientDialog;
