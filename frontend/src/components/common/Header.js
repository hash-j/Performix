import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const drawerWidth = 280;

  // Fetch unread count on component mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch activities when notifications menu opens and mark them as read
  useEffect(() => {
    if (notificationsAnchor) {
      fetchActivities();
      // Refresh every 30 seconds while notifications are open
      const interval = setInterval(fetchActivities, 30000);
      return () => clearInterval(interval);
    }
  }, [notificationsAnchor]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/activities/unread/count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchActivities = async () => {
    setLoadingNotifications(true);
    try {
      const response = await api.get('/activities?limit=10');
      const activities = response.data.map((activity) => ({
        id: activity.id,
        text: formatActivityText(activity),
        time: formatTime(activity.created_at),
        timestamp: new Date(activity.created_at),
        is_read: activity.is_read,
      }));
      setNotifications(activities);

      // Mark all fetched activities as read
      const unreadActivityIds = activities
        .filter((activity) => !activity.is_read)
        .map((activity) => activity.id);

      if (unreadActivityIds.length > 0) {
        markActivitiesAsRead(unreadActivityIds);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Keep existing notifications if fetch fails
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markActivitiesAsRead = async (activityIds) => {
    try {
      await api.post('/activities/mark-as-read', { activityIds });
      // Refresh unread count after marking as read
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking activities as read:', error);
    }
  };

  const formatActivityText = (activity) => {
    const action = activity.action_type;
    const entity = activity.entity_name;
    const user = activity.user_name || 'Unknown User';

    if (action === 'user_added') {
      return `${user} added new user: ${entity}`;
    } else if (action === 'user_deleted') {
      return `${user} deleted user: ${entity}`;
    } else if (action === 'user_edited') {
      return `${user} edited user: ${entity}`;
    } else if (action === 'client_added') {
      return `${user} added new client: ${entity}`;
    } else if (action === 'client_deleted') {
      return `${user} deleted client: ${entity}`;
    } else if (action === 'client_edited') {
      return `${user} edited client: ${entity}`;
    } else if (action === 'team_member_added') {
      return `${user} added new team member: ${entity}`;
    } else if (action === 'team_member_deleted') {
      return `${user} deleted team member: ${entity}`;
    } else if (action === 'team_member_edited') {
      return `${user} edited team member: ${entity}`;
    } else if (action === 'data_added') {
      return `${user} added ${activity.entity_type} data for ${entity}`;
    } else if (action === 'data_deleted') {
      return `${user} deleted ${activity.entity_type} data for ${entity}`;
    } else if (action === 'data_edited') {
      return `${user} edited ${activity.entity_type} data for ${entity}`;
    }
    return activity.description || `${user} performed an action`;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return created.toLocaleDateString();
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifications = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotificationsAnchor(null);
  };

  const handleMenuItemClick = (action) => {
    handleCloseUserMenu();

    if (action === 'Profile') {
      window.open('/profile', '_blank');
    } else if (action === 'Logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(26, 26, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(242, 5, 5, 0.2)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
        borderRadius: 0,
        ml: sidebarOpen ? { xs: 0, sm: `${drawerWidth}px` } : 0,
        width: sidebarOpen ? { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` } : '100%',
        transition: 'all 0.3s ease',
      }}
    >
      <Toolbar sx={{ minHeight: '70px' }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'white',
              background: 'linear-gradient(90deg, #F20505 0%, #ffaaaa 25%, #ffffff 50%, #ffaaaa 75%, #F20505 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShine 4s linear infinite',
              '@keyframes gradientShine': {
                '0%': { backgroundPosition: '0% center' },
                '100%': { backgroundPosition: '200% center' },
              }
            }}
          >
            Performix
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleOpenNotifications} sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.15)' } }}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleCloseNotifications}
            PaperProps={{
              sx: {
                width: 320,
                maxHeight: 400,
                mt: 1.5,
              }
            }}
          >
            <Typography sx={{ p: 2, fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#1a1a1a' }}>
              Notifications
              {loadingNotifications && <CircularProgress size={16} />}
            </Typography>
            {notifications.length === 0 && !loadingNotifications ? (
              <MenuItem disabled sx={{ py: 2, justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  No activities yet
                </Typography>
              </MenuItem>
            ) : (
              notifications.map((notification) => (
                <MenuItem key={notification.id} sx={{ py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {notification.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.time}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
            <MenuItem 
              onClick={() => {
                handleCloseNotifications();
                navigate('/activity-history');
              }}
              sx={{ justifyContent: 'center', color: '#F20505', fontWeight: 'bold', py: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: '#1a1a1a' }}
            >
              View all activities
            </MenuItem>
          </Menu>

          {/* User Profile */}
          <Tooltip title="Account settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.15)' } }}>
              <Avatar 
                sx={{ 
                  background: 'linear-gradient(135deg, #F20505 0%, #400106 100%)',
                  width: 36,
                  height: 36,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            PaperProps={{
              sx: {
                width: 250,
                mt: 1.5,
              }
            }}
          >
            {/* User Info */}
            <Box sx={{ px: 2, py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {user?.full_name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 1.5,
                    py: 0.5,
                    bgcolor:
                      user?.role === 'admin'
                        ? '#ff6b6b'
                        : user?.role === 'editor'
                        ? '#ffd43b'
                        : '#51cf66',
                    color: user?.role === 'editor' ? '#0f0f1e' : 'white',
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {user?.role}
                </Box>
              </Box>
            </Box>

            {/* Menu Items */}
            <MenuItem onClick={() => handleMenuItemClick('Profile')}>
              <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
              <Typography variant="body2">View Profile</Typography>
            </MenuItem>

            <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', my: 1 }} />
            <MenuItem onClick={() => handleMenuItemClick('Logout')} sx={{ color: 'error.main' }}>
              <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;