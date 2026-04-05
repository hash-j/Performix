import React, { useState, useContext } from 'react';
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
} from '@mui/material';
import {
  AppRegistration as RegisterIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
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
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_name.trim()) newErrors.company_name = 'Company Name is required';
    if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required';
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
    setServerError('');
    try {
      // Create company and user
      await api.post('/auth/register', formData);
      setSuccess(true);
      
      // Auto login after successful signup
      await login(formData.username, formData.password);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear field errors
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #8C0303 0%, #400106 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4, bgcolor: '#262626' }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  gap: 1,
                }}
              >
                <RegisterIcon sx={{ fontSize: 40, color: '#F20505' }} />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #8C0303 0%, #F20505 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Create Workspace
                </Typography>
              </Box>
              <Typography variant="body2" color="gray">
                Start tracking your business KPIs today!
              </Typography>
            </Box>

            {/* Alert Messages */}
            {serverError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {serverError}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Workspace created! Logging you in...
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="subtitle2" color="primary.light" sx={{ mt: 1, mb: 1 }}>Company Details</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  error={!!errors.company_name}
                  helperText={errors.company_name}
                  margin="dense"
                  sx={{ input: { color: 'white' }, label: { color: 'gray' }}}
                />
                <TextField
                  fullWidth
                  label="Industry (Optional)"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  margin="dense"
                  sx={{ input: { color: 'white' }, label: { color: 'gray' }}}
                />
              </Box>

              <Typography variant="subtitle2" color="primary.light" sx={{ mt: 3, mb: 1 }}>Your Account</Typography>
              <TextField
                  fullWidth
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  error={!!errors.full_name}
                  helperText={errors.full_name}
                  margin="dense"
                  sx={{ input: { color: 'white' }, label: { color: 'gray' }}}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!errors.username}
                  helperText={errors.username}
                  margin="dense"
                  sx={{ input: { color: 'white' }, label: { color: 'gray' }}}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  margin="dense"
                  sx={{ input: { color: 'white' }, label: { color: 'gray' }}}
                />
              </Box>

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
                InputProps={{
                  style: { color: 'white' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'gray' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ label: { color: 'gray' } }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #F20505 0%, #590202 100%)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #F20505 0%, #F20505 100%)',
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
              </Button>
            </Box>

            {/* Footer */}
            <Typography variant="body2" sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'gray' }}>
              Already have an account? <Link to="/login" style={{ color: '#F20505', textDecoration: 'none' }}>Sign In here</Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;
