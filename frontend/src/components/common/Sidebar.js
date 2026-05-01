import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';

import {
  Dashboard as DashboardIcon,
  SocialDistance as SocialMediaIcon,
  Language as WebsiteIcon,
  Campaign as AdsIcon,
  Email as EmailIcon,
  Reviews as ReviewsIcon,
  People as PeopleIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Hub as IntegrationIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

const Sidebar = ({ open, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = useState({});

  const mainMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'KPI Builder',
      icon: <AddIcon />,
      path: '/kpi-builder',
    },
    {
      text: 'Team',
      icon: <PeopleIcon />,
      path: '/team',
    },
    {
      text: 'Integrations',
      icon: <IntegrationIcon />,
      path: '/integrations',
    },
  ];

  const handleMenuClick = (item) => {
    if (item.subItems) {
      setOpenSubMenu(prev => ({
        ...prev,
        [item.text]: !prev[item.text]
      }));
    } else {
      navigate(item.path);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleSubItemClick = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 0,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: 0,
          backgroundColor: '#161616',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Sidebar Header */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
        backgroundColor: '#161616',
      }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Logo from public folder */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.textContent = '🚀';
            }}
          />
        </Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Performix
        </Typography>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {mainMenuItems.map((item) => (
            <React.Fragment key={item.text}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => handleMenuClick(item)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    '&.Mui-selected': {
                      backgroundColor: 'transparent',
                      color: '#F20505',
                      borderLeft: '4px solid #F20505',
                      backgroundImage: 'linear-gradient(90deg, rgba(242,5,5,0.15) 0%, rgba(242,5,5,0) 100%)',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        transform: 'translateX(6px)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#F20505',
                      },
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'rgba(242, 5, 5, 0.05)',
                      transform: 'translateX(6px)',
                      '& .MuiListItemIcon-root': {
                        color: '#F20505',
                        transform: 'scale(1.15)',
                      }
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, transition: 'transform 0.3s ease' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    }}
                  />
                  {item.badge && (
                    <Chip 
                      label={item.badge} 
                      size="small" 
                      color="primary"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                  {item.subItems && (
                    openSubMenu[item.text] ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>
              
              {item.subItems && (
                <Collapse in={openSubMenu[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.text}
                        onClick={() => handleSubItemClick(subItem.path)}
                        sx={{ 
                          pl: 8,
                          py: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(242, 5, 5, 0.08)',
                          },
                        }}
                      >
                        <ListItemText 
                          primary={subItem.text}
                          primaryTypographyProps={{
                            fontSize: '0.85rem',
                            color: 'text.secondary',
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Typography variant="caption" color="text.secondary">
          Performix SaaS v3.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;