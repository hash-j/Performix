import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Avatar,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../services/api';
import { formatDateOnly } from '../utils/dateFormatter';

const ActivityHistory = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
  const [endDate, setEndDate] = useState(new Date());
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [actionTypes, setActionTypes] = useState([]);
  const [entityTypes, setEntityTypes] = useState([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/activities', {
        params: {
          limit: 1000, // Fetch more for client-side filtering
        }
      });
      
      const data = response.data || [];
      setActivities(data);
      
      // Extract unique action and entity types
      const uniqueActionTypes = [...new Set(data.map(a => a.action_type))];
      const uniqueEntityTypes = [...new Set(data.map(a => a.entity_type))];
      
      setActionTypes(uniqueActionTypes.sort());
      setEntityTypes(uniqueEntityTypes.sort());
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    fetchActivities();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter activities based on criteria
  const filteredActivities = activities.filter(activity => {
    const activityDate = new Date(activity.created_at);
    const dateInRange = activityDate >= startDate && activityDate <= endDate;
    const matchesActionType = !actionTypeFilter || activity.action_type === actionTypeFilter;
    const matchesEntityType = !entityTypeFilter || activity.entity_type === entityTypeFilter;
    const matchesSearch = !searchText || 
      activity.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      activity.entity_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      activity.user_name?.toLowerCase().includes(searchText.toLowerCase());
    
    return dateInRange && matchesActionType && matchesEntityType && matchesSearch;
  });

  // Paginate filtered activities
  const paginatedActivities = filteredActivities.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getActionIcon = (actionType) => {
    switch(actionType) {
      case 'data_added':
        return <AddIcon fontSize="small" sx={{ color: '#4caf50' }} />;
      case 'data_edited':
        return <EditIcon fontSize="small" sx={{ color: '#ff9800' }} />;
      case 'data_deleted':
        return <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />;
      default:
        return <MoreVertIcon fontSize="small" sx={{ color: '#9c27b0' }} />;
    }
  };

  const getActionLabel = (actionType) => {
    const labels = {
      'data_added': 'Added',
      'data_edited': 'Edited',
      'data_deleted': 'Deleted',
      'user_added': 'User Added',
      'client_added': 'Client Added',
    };
    return labels[actionType] || actionType;
  };

  const getEntityColor = (entityType) => {
    const colors = {
      'email_marketing': 'primary',
      'social_media': 'secondary',
      'ads': 'success',
      'website_seo': 'warning',
      'client_responses': 'info',
      'team_kpis': 'error',
      'client': 'secondary',
      'user': 'primary',
      'team_member': 'success',
    };
    return colors[entityType] || 'default';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const secondsAgo = Math.floor((now - new Date(date)) / 1000);

    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
    
    return formatDateOnly(date);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f0f1e', p: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#fff' }}>
            Activity History
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View all dashboard actions and changes performed by users
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Activities
                </Typography>
                <Typography variant="h5">
                  {activities.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Filtered Results
                </Typography>
                <Typography variant="h5">
                  {filteredActivities.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Action Types
                </Typography>
                <Typography variant="h5">
                  {actionTypes.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Entity Types
                </Typography>
                <Typography variant="h5">
                  {entityTypes.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={actionTypeFilter}
                  onChange={(e) => {
                    setActionTypeFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Action Type"
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {actionTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {getActionLabel(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={entityTypeFilter}
                  onChange={(e) => {
                    setEntityTypeFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Entity Type"
                >
                  <MenuItem value="">All Entities</MenuItem>
                  {entityTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                placeholder="Search..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(0);
                }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Activities Table */}
        <Paper sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: 'rgba(10, 88, 191, 0.1)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Entity Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Entity Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tab</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedActivities.length > 0 ? (
                      paginatedActivities.map((activity, index) => (
                        <TableRow key={activity.id} sx={{ 
                          '&:hover': { backgroundColor: 'rgba(10, 88, 191, 0.05)' },
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  fontSize: '0.875rem',
                                  bgcolor: 'primary.main'
                                }}
                              >
                                {activity.user_name?.charAt(0) || 'U'}
                              </Avatar>
                              <Typography variant="body2">
                                {activity.user_name || 'System'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getActionIcon(activity.action_type)}
                              <Chip
                                label={getActionLabel(activity.action_type)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={activity.entity_type}
                              size="small"
                              color={getEntityColor(activity.entity_type)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {activity.entity_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {activity.tab_name ? (
                              <Chip label={activity.tab_name} size="small" />
                            ) : (
                              <Typography variant="body2" color="textSecondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 250,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={activity.description}
                            >
                              {activity.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {formatTimeAgo(activity.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="textSecondary">
                            No activities found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredActivities.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default ActivityHistory;
