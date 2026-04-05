import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Alert,
  Divider,
  CircularProgress,
  Tab,
  Tabs,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user: currentUser, changePassword, logout } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully! You will be logged out in 2 seconds...');
      
      // Logout user after 2 seconds to allow them to see the success message
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user && currentUser) {
    setUser(currentUser);
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#262626',
        padding: 3,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1,
            }}
          >
            <PersonIcon sx={{ fontSize: 32, color: '#F20505' }} />
            My Profile
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your account information and security settings
          </Typography>
        </Box>

        {/* Profile Card */}
        <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  background: 'linear-gradient(135deg, #F20505 0%, #400106 100%)',
                  fontSize: '2.5rem',
                }}
              >
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {user?.full_name}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {user?.email}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 0.5,
                    bgcolor:
                      user?.role === 'admin'
                        ? '#ff6b6b'
                        : user?.role === 'editor'
                        ? '#ffd43b'
                        : '#51cf66',
                    color: 'white',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {user?.role}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{
                borderBottom: '2px solid #e0e0e0',
                mb: 3,
              }}
            >
              <Tab label="Account Information" />
              <Tab label="Change Password" />
              {user?.role === 'admin' && <Tab label="Billing & Subscription" />}
            </Tabs>

            {/* Tab Content */}
            {tabValue === 0 && (
              <Box>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="Full Name"
                    value={user?.full_name || ''}
                    disabled
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Username"
                    value={user?.username || ''}
                    disabled
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Role"
                    value={user?.role || ''}
                    disabled
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Workspace / Company"
                    value={user?.company_name || 'Loading...'}
                    disabled
                    fullWidth
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Account created: {new Date(user?.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            )}

            {tabValue === 1 && (
              <Box component="form" onSubmit={handlePasswordChange}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}

                <Box sx={{ display: 'grid', gap: 2, maxWidth: 500 }}>
                  <TextField
                    label="Current Password"
                    type={passwordData.showCurrent ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setPasswordData({
                                ...passwordData,
                                showCurrent: !passwordData.showCurrent,
                              })
                            }
                            edge="end"
                          >
                            {passwordData.showCurrent ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="New Password"
                    type={passwordData.showNew ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setPasswordData({
                                ...passwordData,
                                showNew: !passwordData.showNew,
                              })
                            }
                            edge="end"
                          >
                            {passwordData.showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Confirm New Password"
                    type={passwordData.showConfirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setPasswordData({
                                ...passwordData,
                                showConfirm: !passwordData.showConfirm,
                              })
                            }
                            edge="end"
                          >
                            {passwordData.showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(135deg, #F20505 0%, #400106 100%)',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      mt: 2,
                    }}
                  >
                    <LockIcon sx={{ mr: 1 }} /> Update Password
                  </Button>
                </Box>
              </Box>
            )}

            {tabValue === 2 && user?.role === 'admin' && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Workspace Subscription</Typography>
                <Card sx={{ bgcolor: '#400106', color: 'white', mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" color="gray">Current Plan</Typography>
                        <Typography variant="h4" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                          {user?.subscription_plan} Plan
                        </Typography>
                        {user?.subscription_plan === 'free' && (
                          <Typography variant="body2" sx={{ mt: 1 }}>Limits: Max 3 custom KPIs.</Typography>
                        )}
                      </Box>
                      {user?.subscription_plan === 'free' && (
                         <Button variant="contained" color="secondary" onClick={() => alert('Stripe Checkout Simulator: Please upgrade here in production!')}>
                           Upgrade to PRO
                         </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Info Message */}
        <Card sx={{ bgcolor: 'rgba(242, 5, 5, 0.1)', border: '1px solid rgba(242, 5, 5, 0.3)' }}>
          <CardContent>
            <Typography variant="body2">
              <strong>Note:</strong> For security reasons, some account details cannot be changed from this profile
              page. Contact your administrator if you need to update your email or username.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Profile;
