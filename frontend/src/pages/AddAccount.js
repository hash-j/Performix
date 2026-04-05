import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AddAccount = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validations, setValidations] = useState({
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
    hasSpecial: false,
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      // Redirect if not admin
      window.location.href = '/dashboard';
    }
  }, [user]);

  const calculatePasswordStrength = (password) => {
    const newValidations = {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
    };
    setValidations(newValidations);

    const strength = Object.values(newValidations).filter(Boolean).length;
    setPasswordStrength((strength / 4) * 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);

      setSuccess(true);
      setFormData({
        full_name: '',
        username: '',
        email: '',
        password: '',
        role: 'viewer',
      });
      setPasswordStrength(0);
      setValidations({
        minLength: false,
        hasNumber: false,
        hasUppercase: false,
        hasSpecial: false,
      });

      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create account';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'rgba(255, 255, 255, 0.3)';
    if (passwordStrength <= 25) return '#f44336';
    if (passwordStrength <= 50) return '#ff9800';
    if (passwordStrength <= 75) return '#fdd835';
    return '#4caf50';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#0f0f1e',
        padding: 3,
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 1,
            }}
          >
            <PersonIcon sx={{ fontSize: 32, color: '#0A58BF' }} />
            Create New Account
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Add a new user to the KPI Dashboard
          </Typography>
        </Box>

        {/* Main Card */}
        <Card sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Alerts */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
                Account created successfully!
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              {/* Full Name */}
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                margin="normal"
                placeholder="John Doe"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#0A58BF' }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Username */}
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                margin="normal"
                placeholder="johndoe"
                helperText="Username will be used for login"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#0A58BF' }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Email */}
              <TextField
                fullWidth
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                placeholder="john@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#0A58BF' }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password */}
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                margin="normal"
                placeholder="Enter a strong password"
                helperText="Use at least 8 characters with a mix of uppercase, numbers, and special characters"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#0A58BF' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <Box sx={{ my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Password Strength:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: getPasswordStrengthColor(),
                        fontWeight: 600,
                      }}
                    >
                      {passwordStrength === 0
                        ? 'Weak'
                        : passwordStrength <= 25
                        ? 'Very Weak'
                        : passwordStrength <= 50
                        ? 'Fair'
                        : passwordStrength <= 75
                        ? 'Good'
                        : 'Strong'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPasswordStrengthColor(),
                      },
                    }}
                  />

                  {/* Validation Checklist */}
                  <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {validations.minLength ? (
                        <CheckIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                      ) : (
                        <CloseIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 18 }} />
                      )}
                      <Typography variant="caption">At least 8 characters</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {validations.hasNumber ? (
                        <CheckIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                      ) : (
                        <CloseIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 18 }} />
                      )}
                      <Typography variant="caption">Contains number</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {validations.hasUppercase ? (
                        <CheckIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                      ) : (
                        <CloseIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 18 }} />
                      )}
                      <Typography variant="caption">Uppercase letter</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {validations.hasSpecial ? (
                        <CheckIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                      ) : (
                        <CloseIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 18 }} />
                      )}
                      <Typography variant="caption">Special character</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Role Selection */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  <MenuItem value="admin">Admin - Full Access</MenuItem>
                  <MenuItem value="editor">Editor - Can Add & Edit Data</MenuItem>
                  <MenuItem value="viewer">Viewer - Read-Only Access</MenuItem>
                </Select>
              </FormControl>

              {/* Submit Button */}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #5505A6 0%, #041340 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7B3FD1 0%, #041A59 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
          <CardContent>
            <Typography variant="body2">
              <strong>Admin Only:</strong> Only administrators can create new user accounts. Users will be able to
              log in immediately after account creation with the credentials you provide.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AddAccount;
