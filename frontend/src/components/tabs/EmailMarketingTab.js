import React, { useState, useEffect, useContext } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Rating,
  Avatar,
  Popover,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Send as SendIcon,
  OpenInNew as OpenInNewIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import api from '../../services/api';
import { formatDateOnly } from '../../utils/dateFormatter';
import { AuthContext } from '../../context/AuthContext';

const EmailMarketingTab = () => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [membersPopoverAnchor, setMembersPopoverAnchor] = useState(null);
  const [selectedMembersItem, setSelectedMembersItem] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    team_member_ids: [],
    date: new Date(),
    template_quality: 5,
    emails_sent: 0,
    opening_ratio: 0,
  });

  useEffect(() => {
    fetchData();
    fetchClients();
    fetchTeamMembers();
  }, [startDate, endDate, selectedClient]);

  const fetchData = async () => {
    try {
      const params = {
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(endDate),
      };
      if (selectedClient) params.clientId = selectedClient;
      
      const response = await api.get('/email', { params });
      const formattedData = response.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching email marketing data:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/team');
      setTeamMembers(response.data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        client_id: item.client_id,
        team_member_ids: item.team_member_ids || (item.team_member_id ? [item.team_member_id] : []),
        date: new Date(item.date),
        template_quality: item.template_quality,
        emails_sent: item.emails_sent,
        opening_ratio: item.opening_ratio,
      });
    } else {
      setEditingItem(null);
      setFormData({
        client_id: '',
        team_member_ids: [],
        date: new Date(),
        template_quality: 5,
        emails_sent: 0,
        opening_ratio: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        date: formatDateOnly(formData.date),
      };

      if (editingItem) {
        await api.put(`/email/${editingItem.id}`, payload);
      } else {
        await api.post('/email', payload);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await api.delete(`/email/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  const handleOpenMembersPopover = (event, item) => {
    setMembersPopoverAnchor(event.currentTarget);
    setSelectedMembersItem(item);
  };

  const handleCloseMembersPopover = () => {
    setMembersPopoverAnchor(null);
    setSelectedMembersItem(null);
  };

  const getMemberName = (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member ? member.name : `Unknown (${memberId})`;
  };

const calculateStats = () => {
  if (data.length === 0) {
    return {
      totalEmailsSent: 0,
      avgOpeningRatio: 0,
      avgTemplateQuality: 0,
      bestOpeningRatio: 0,
      worstOpeningRatio: 0,
      totalOpens: 0
    };
  }
  
  const validOpeningRatios = data.filter(item => {
    const ratio = parseFloat(item.opening_ratio);
    return !isNaN(ratio) && ratio > 0;
  });
  
  const stats = {
    totalEmailsSent: data.reduce((sum, item) => sum + (item.emails_sent || 0), 0),
    avgOpeningRatio: validOpeningRatios.length > 0 ? 
      validOpeningRatios.reduce((sum, item) => sum + parseFloat(item.opening_ratio || 0), 0) / validOpeningRatios.length : 0,
    avgTemplateQuality: data.reduce((sum, item) => sum + (item.template_quality || 0), 0) / data.length,
    bestOpeningRatio: validOpeningRatios.length > 0 ? 
      Math.max(...validOpeningRatios.map(item => parseFloat(item.opening_ratio || 0))) : 0,
    worstOpeningRatio: validOpeningRatios.length > 0 ? 
      Math.min(...validOpeningRatios.map(item => parseFloat(item.opening_ratio || 0))) : 0,
  };
  
  stats.totalOpens = (stats.totalEmailsSent * stats.avgOpeningRatio) / 100;
  
  return stats;
};

  const stats = calculateStats();

  const performanceData = data.map(item => ({
    date: item.date,
    emails: item.emails_sent,
    opens: Math.round((item.emails_sent * (parseFloat(item.opening_ratio) || 0)) / 100),
    ratio: parseFloat(item.opening_ratio) || 0,
    quality: item.template_quality,
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f0f1e', p: 2 }}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  label="Client"
                >
                  <MenuItem value="">All Clients</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              {canEdit && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  fullWidth
                >
                  Add Email Entry
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Emails</Typography>
                </Box>
                <Typography variant="h3" color="primary" gutterBottom>
                  {stats.totalEmailsSent.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Emails Sent
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <OpenInNewIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Opening Ratio</Typography>
                </Box>
                <Box>
                  <Typography variant="h3" color="secondary" gutterBottom>
                    {stats.avgOpeningRatio ? stats.avgOpeningRatio.toFixed(1) : 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.avgOpeningRatio || 0} 
                    sx={{ height: 8, borderRadius: 4 }}
                    color={stats.avgOpeningRatio > 50 ? "success" : stats.avgOpeningRatio > 30 ? "warning" : "error"}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StarIcon sx={{ color: '#3A7FD9', mr: 1 }} />
                  <Typography variant="h6">Template Quality</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating
                      value={stats.avgTemplateQuality / 2}
                      precision={0.1}
                      readOnly
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="h6">
                      {stats.avgTemplateQuality ? stats.avgTemplateQuality.toFixed(1) : 0}/10
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Average Quality Score
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon sx={{ color: '#5505A6', mr: 1 }} />
                  <Typography variant="h6">Total Opens</Typography>
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ color: '#5505A6' }} gutterBottom>
                    {Math.round(stats.totalOpens).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Estimated Email Opens
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Email Performance Trends
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="emails"
                    stroke="#0A58BF"
                    fill="#0A58BF"
                    fillOpacity={0.3}
                    name="Emails Sent"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="opens"
                    stroke="#5505A6"
                    fill="#5505A6"
                    fillOpacity={0.3}
                    name="Estimated Opens"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ratio"
                    stroke="#3A7FD9"
                    name="Opening Ratio %"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Quality vs Opening Ratio
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performanceData.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quality" fill="#ff9800" name="Quality Score" />
                  <Bar dataKey="ratio" fill="#4caf50" name="Opening Ratio %" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Performance Comparison */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Client Performance Comparison
              </Typography>
              <Grid container spacing={2}>
                {clients.map((client) => {
                  const clientData = data.filter(item => item.client_id === client.id);
                  if (clientData.length === 0) return null;

                  const clientStats = {
                    totalEmails: clientData.reduce((sum, item) => sum + (item.emails_sent || 0), 0),
                    avgRatio: clientData.reduce((sum, item) => sum + (parseFloat(item.opening_ratio) || 0), 0) / clientData.length,
                    avgQuality: clientData.reduce((sum, item) => sum + (item.template_quality || 0), 0) / clientData.length,
                  };

                  return (
                    <Grid item xs={12} sm={6} md={3} key={client.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {client.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            {clientStats.totalEmails.toLocaleString()} emails sent
                          </Typography>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                              Opening Ratio
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={isNaN(clientStats.avgRatio) ? 0 : clientStats.avgRatio}
                              sx={{ height: 6, borderRadius: 3 }}
                              color={clientStats.avgRatio > 50 ? "success" : clientStats.avgRatio > 30 ? "warning" : "error"}
                            />
                            <Typography variant="body2" align="right">
                              {isNaN(clientStats.avgRatio) ? '0.0' : clientStats.avgRatio.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Template Quality
                            </Typography>
                            <Rating
                              value={clientStats.avgQuality / 2}
                              precision={0.5}
                              readOnly
                              size="small"
                            />
                            <Typography variant="body2" align="right">
                              {clientStats.avgQuality.toFixed(1)}/10
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Data Table */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Email Marketing Data
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Emails Sent</TableCell>
                  <TableCell>Opening Ratio</TableCell>
                  <TableCell>Template Quality</TableCell>
                  <TableCell>Estimated Opens</TableCell>
                  <TableCell>Team Member</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.client_name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SendIcon color="action" fontSize="small" />
                        {item.emails_sent.toLocaleString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={item.opening_ratio !== null && item.opening_ratio !== undefined ? `${parseFloat(item.opening_ratio).toFixed(2)}%` : '0%'}
                          size="small"
                          color={item.opening_ratio > 50 ? "success" : item.opening_ratio > 30 ? "warning" : "error"}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={item.opening_ratio || 0}
                          sx={{ width: 60, height: 6 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating
                          value={item.template_quality / 2}
                          precision={0.5}
                          readOnly
                          size="small"
                        />
                        <Typography variant="body2">
                          {item.template_quality}/10
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {Math.round((item.emails_sent * item.opening_ratio) / 100).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const memberIds = item.team_member_ids || [];
                        if (memberIds.length === 0) {
                          return item.team_member_name || 'N/A';
                        }
                        if (memberIds.length === 1) {
                          return getMemberName(memberIds[0]);
                        }
                        return (
                          <Chip
                            label={`View Members (${memberIds.length})`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onClick={(e) => handleOpenMembersPopover(e, item)}
                            sx={{ cursor: 'pointer' }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <>
                          <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingItem ? 'Edit Email Marketing Entry' : 'Add Email Marketing Entry'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    label="Client"
                  >
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Team Member</InputLabel>
                  <Select
                    multiple
                    value={formData.team_member_ids}
                    onChange={(e) => setFormData({ ...formData, team_member_ids: e.target.value })}
                    label="Team Member"
                  >
                    {teamMembers.map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>Template Quality: {formData.template_quality}/10</Typography>
                <Slider
                  value={formData.template_quality}
                  onChange={(_, value) => setFormData({ ...formData, template_quality: value })}
                  min={0}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Emails Sent"
                  type="number"
                  value={formData.emails_sent}
                  onChange={(e) => setFormData({ ...formData, emails_sent: parseInt(e.target.value) || 0 })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Opening Ratio (%)"
                  type="number"
                  value={formData.opening_ratio}
                  onChange={(e) => setFormData({ ...formData, opening_ratio: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    endAdornment: <Typography>%</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Members Popover */}
        <Popover
          open={Boolean(membersPopoverAnchor)}
          anchorEl={membersPopoverAnchor}
          onClose={handleCloseMembersPopover}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <Paper sx={{ p: 2, minWidth: 250 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Team Members
            </Typography>
            {selectedMembersItem && (selectedMembersItem.team_member_ids || []).map((memberId, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    fontSize: '0.75rem',
                  }}
                >
                  {getMemberName(memberId)
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </Avatar>
                <Typography variant="body2">
                  {getMemberName(memberId)}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Popover>
      </Box>
    </LocalizationProvider>
  );
};

export default EmailMarketingTab;