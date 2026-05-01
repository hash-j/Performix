import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import InstagramIcon from '@mui/icons-material/Instagram';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'facebook_ads',
    name: 'Meta Ads',
    description: 'Connect to pull leads, cost per lead, and closing ratios automatically.',
    icon: <FacebookIcon sx={{ fontSize: 40, color: '#1877F2' }} />,
    color: '#1877F2'
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Pull search volume, CPC, and conversion data directly from Google.',
    icon: <GoogleIcon sx={{ fontSize: 40, color: '#DB4437' }} />,
    color: '#DB4437'
  },
  {
    id: 'instagram',
    name: 'Instagram Insights',
    description: 'Sync followers, post engagement, and reel performance metrics.',
    icon: <InstagramIcon sx={{ fontSize: 40, color: '#E1306C' }} />,
    color: '#E1306C'
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics 4',
    description: 'Automatically pull website traffic, backlinks, and site health data.',
    icon: <QueryStatsIcon sx={{ fontSize: 40, color: '#F4B400' }} />,
    color: '#F4B400'
  }
];

const Integrations = () => {
  const { user } = useContext(AuthContext);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id of platform
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/integrations');
      setConnections(res.data);
    } catch (err) {
      showNotification('Failed to load integrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleConnect = async (platformId) => {
    setActionLoading(platformId);
    try {
      // Simulate an OAuth redirect delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await api.post('/integrations/connect', { platform: platformId });
      showNotification('Successfully connected! You can now sync data.');
      fetchConnections();
    } catch (err) {
      showNotification('Failed to connect', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (platformId) => {
    setActionLoading(platformId);
    try {
      await api.post('/integrations/disconnect', { platform: platformId });
      showNotification('Disconnected successfully');
      fetchConnections();
    } catch (err) {
      showNotification('Failed to disconnect', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (platformId) => {
    setActionLoading(`sync_${platformId}`);
    try {
      await api.post('/integrations/sync', { platform: platformId });
      showNotification('Data synced successfully! Check your dashboard.');
      fetchConnections();
    } catch (err) {
      showNotification('Failed to sync data', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatus = (platformId) => {
    const conn = connections.find(c => c.platform === platformId);
    if (!conn) return 'disconnected';
    return conn.status;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>
          Integration Hub
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Connect your favorite platforms to automate data entry and fetch KPIs automatically.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {AVAILABLE_INTEGRATIONS.map((platform) => {
          const status = getStatus(platform.id);
          const isConnected = status === 'connected';
          const isActionLoading = actionLoading === platform.id;
          const isSyncing = actionLoading === `sync_${platform.id}`;

          return (
            <Grid item xs={12} md={6} lg={4} key={platform.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: isConnected ? `1px solid ${platform.color}` : '1px solid transparent',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                {isConnected && (
                  <Chip 
                    label="Connected" 
                    color="success" 
                    size="small" 
                    sx={{ position: 'absolute', top: -10, right: 20, fontWeight: 'bold' }} 
                  />
                )}
                
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.05)', width: 56, height: 56, mr: 2 }}>
                      {platform.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      {platform.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {platform.description}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
                  {isConnected ? (
                    <>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={isActionLoading || isSyncing}
                      >
                        {isActionLoading ? <CircularProgress size={20} /> : 'Disconnect'}
                      </Button>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleSync(platform.id)}
                        disabled={isActionLoading || isSyncing}
                        sx={{ 
                          bgcolor: platform.color,
                          '&:hover': { bgcolor: platform.color, filter: 'brightness(0.9)' }
                        }}
                      >
                        {isSyncing ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sync Data'}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      fullWidth
                      variant="outlined"
                      onClick={() => handleConnect(platform.id)}
                      disabled={isActionLoading}
                      sx={{ 
                        color: platform.color, 
                        borderColor: platform.color,
                        '&:hover': { borderColor: platform.color, bgcolor: `${platform.color}11` }
                      }}
                    >
                      {isActionLoading ? <CircularProgress size={20} sx={{ color: platform.color }} /> : 'Connect'}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Integrations;
