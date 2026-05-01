import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Business as BusinessIcon,
} from '@mui/icons-material';
import api from '../services/api'; // Or wherever your axios instance is

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    full_name: '',
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setAuthError('');
    try {
      // Direct API call to register, as it's not in AuthContext yet
      const response = await api.post('/auth/register', formData);
      
      // We can automatically log them in or just redirect to login
      // If we want to auto-login, we'd need to store the token:
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setSuccess(true);
      setTimeout(() => {
        // Hard refresh or redirect to ensure context picks up the token
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F20505 0%, #400106 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  gap: 1,
                }}
              >
                <BusinessIcon sx={{ fontSize: 40, color: '#F20505' }} />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #F20505 0%, #400106 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Performix
                </Typography>
              </Box>
              <Typography variant="body1" color="textSecondary">
                Create a Workspace for your Agency
              </Typography>
            </Box>

            {/* Alert Messages */}
            {authError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {authError}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Workspace created successfully! Preparing your dashboard...
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company/Agency Name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    error={!!errors.company_name}
                    helperText={errors.company_name}
                    margin="normal"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Industry (Optional)"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    margin="normal"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admin Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    error={!!errors.full_name}
                    helperText={errors.full_name}
                    margin="normal"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    error={!!errors.username}
                    helperText={errors.username}
                    margin="normal"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    margin="normal"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    margin="normal"
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{
                  mt: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #F20505 0%, #400106 100%)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ff4d4d 0%, #590202 100%)',
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Workspace'}
              </Button>
            </Box>

            {/* Footer */}
            <Typography variant="body2" sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'gray' }}>
              Already have an account? <Link to="/login" style={{ color: '#F20505', textDecoration: 'none' }}>Sign In</Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;
