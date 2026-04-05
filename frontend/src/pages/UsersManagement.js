import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const UsersManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'edit', 'add'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  });

  // Check if current user is admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setError('Only administrators can access this page');
      return;
    }
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode, user = null) => {
    setDialogMode(mode);
    if (mode === 'view' || mode === 'edit') {
      setSelectedUser(user);
      setFormData({
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        password: '', // Don't show password for security
        role: user.role,
      });
    } else if (mode === 'add') {
      setSelectedUser(null);
      setFormData({
        full_name: '',
        username: '',
        email: '',
        password: '',
        role: 'viewer',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogMode('view');
    setSelectedUser(null);
    setFormData({
      full_name: '',
      username: '',
      email: '',
      password: '',
      role: 'viewer',
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveUser = async () => {
    try {
      if (dialogMode === 'add') {
        // Create new user
        if (!formData.full_name || !formData.username || !formData.email || !formData.password) {
          setError('All fields are required for new user');
          return;
        }
        await api.post('/auth/register', formData);
        setSuccess('User created successfully');
      } else if (dialogMode === 'edit') {
        // Update user
        const updateData = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/auth/users/${selectedUser.id}`, updateData);
        setSuccess('User updated successfully');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
      console.error('Error saving user:', err);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (currentUser?.id === userId) {
      setError('You cannot delete your own account');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await api.delete(`/auth/users/${userId}`);
        setSuccess('User deleted successfully');
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user');
        console.error('Error deleting user:', err);
      }
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'editor':
        return 'warning';
      case 'viewer':
        return 'success';
      default:
        return 'default';
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Only administrators can access this page</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
        >
          Add New User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(10, 88, 191, 0.1)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.toUpperCase()}
                        size="small"
                        color={getRoleChipColor(user.role)}
                        variant={getRoleChipColor(user.role) === 'default' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.is_active ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog('view', user)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          disabled={currentUser?.id === user.id}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* User Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {dialogMode === 'view' && 'View User Details'}
          {dialogMode === 'edit' && 'Edit User'}
          {dialogMode === 'add' && 'Add New User'}
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{ color: 'gray' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleFormChange}
              fullWidth
              disabled={dialogMode === 'view'}
              variant="outlined"
            />
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleFormChange}
              fullWidth
              disabled={dialogMode === 'view' || dialogMode === 'edit'}
              variant="outlined"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              fullWidth
              disabled={dialogMode === 'view'}
              variant="outlined"
            />
            {(dialogMode === 'add' || dialogMode === 'edit') && (
              <TextField
                label={dialogMode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                fullWidth
                required={dialogMode === 'add'}
                variant="outlined"
              />
            )}
            <FormControl fullWidth disabled={dialogMode === 'view'}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                label="Role"
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSaveUser}
              variant="contained"
              color="primary"
            >
              {dialogMode === 'add' ? 'Create User' : 'Update User'}
            </Button>
          )}
          {dialogMode === 'view' && (
            <Button
              onClick={() => handleOpenDialog('edit', selectedUser)}
              variant="contained"
              color="primary"
            >
              Edit User
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsersManagement;
