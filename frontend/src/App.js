import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import AIChatWidget from './components/common/AIChatWidget';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AddAccount from './pages/AddAccount';
import UsersManagement from './pages/UsersManagement';
import ActivityHistory from './pages/ActivityHistory';
import KpiBuilder from './pages/KpiBuilder';

// Context Providers
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ClientsProvider } from './context/ClientsContext';
import { TeamProvider } from './context/TeamContext';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F20505',
      light: '#ff4d4d',
      dark: '#8C0303',
    },
    secondary: {
      main: '#590202',
      light: '#8C0303',
      dark: '#400106',
    },
    background: {
      default: '#1a1a1a',
      paper: '#222222',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#590202',
      light: '#8C0303',
      dark: '#400106',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          borderRadius: 0,
        },
      },
    },
  },
});

// Private Route component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Admin Only Route
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <AuthProvider>
          <ClientsProvider>
            <TeamProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/users-management" element={<UsersManagement />} />
                  <Route
                    path="/add-account"
                    element={
                      <AdminRoute>
                        <AddAccount />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/*"
                    element={
                      <PrivateRoute>
                        <Box sx={{ display: 'flex' }}>
                          <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
                          <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
                          <Box
                            component="main"
                            sx={{
                              flexGrow: 1,
                              height: '100vh',
                              overflow: 'auto',
                              backgroundColor: '#1a1a1a',
                            }}
                          >
                            <Container 
                              maxWidth={false} 
                              sx={{ 
                                mt: 9, 
                                mb: 6,
                                px: { xs: 3, sm: 4, md: 5 },
                              }}
                            >
                              <Routes>
                                <Route path="/" element={<Navigate to="/dashboard" />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/activity-history" element={<ActivityHistory />} />
                                <Route path="/kpi-builder" element={<KpiBuilder />} />
                                <Route path="/team" element={<div style={{color:'white', marginTop:'10px'}}>Team Management (Coming Soon)</div>} />
                              </Routes>
                            </Container>
                            <AIChatWidget />
                          </Box>
                        </Box>
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </Router>
            </TeamProvider>
          </ClientsProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;