import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Switch,
  FormControlLabel,
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
  Avatar,
  Popover,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocationOn as LocationOnIcon,
  EditNote as EditNoteIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import api from '../../services/api';
import { formatDateOnly } from '../../utils/dateFormatter';
import { AuthContext } from '../../context/AuthContext';

const WebsiteSEOTab = () => {
  const navigate = useNavigate();
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
  const [formData, setFormData] = useState({
    client_id: '',
    team_member_ids: [],
    date: new Date(),
    changes_asked: 0,
    blogs_posted: 0,
    ranking_issues: false,
    reports_sent: false,
    ranking_issues_description: '',
    backlinks: 0,
    domain_authority: 50,
    page_authority: 50,
    keyword_pass: 0,
    keyword_names: [],
    keyword_positions: [],
    site_health: 100,
    gmb_updates: 0,
    gmb_changes_count: 0,
    gmb_changes_details: [],
    changes_asked_details: [],
    changes_asked_statuses: [],
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
      
      const response = await api.get('/website-seo', { params });
      const formattedData = response.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching website SEO data:', error);
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
        changes_asked: item.changes_asked,
        changes_asked_details: item.changes_asked_details || [],
        changes_asked_statuses: item.changes_asked_statuses || [],
        blogs_posted: item.blogs_posted,
        ranking_issues: item.ranking_issues,
        reports_sent: item.reports_sent,
        ranking_issues_description: item.ranking_issues_description || '',
        backlinks: item.backlinks,
        domain_authority: item.domain_authority,
        page_authority: item.page_authority,
        keyword_pass: item.keyword_pass,
        keyword_names: item.keyword_names || [],
        keyword_positions: item.keyword_positions || [],
        site_health: item.site_health,
        gmb_updates: item.gmb_updates || 0,
        gmb_changes_count: item.gmb_changes_count || 0,
        gmb_changes_details: item.gmb_changes_details || [],
      });
    } else {
      setEditingItem(null);
      setFormData({
        client_id: '',
        team_member_ids: [],
        date: new Date(),
        changes_asked: 0,
        changes_asked_details: [],
        changes_asked_statuses: [],
        blogs_posted: 0,
        ranking_issues: false,
        reports_sent: false,
        ranking_issues_description: '',
        backlinks: 0,
        domain_authority: 50,
        page_authority: 50,
        keyword_pass: 0,
        keyword_names: [],
        keyword_positions: [],
        site_health: 100,
        gmb_updates: 0,
        gmb_changes_count: 0,
        gmb_changes_details: [],
        changes_asked_details: [],
        changes_asked_statuses: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const [rankingDialogOpen, setRankingDialogOpen] = useState(false);
  const [rankingDialogText, setRankingDialogText] = useState('');
  const [membersPopoverAnchor, setMembersPopoverAnchor] = useState(null);
  const [selectedMembersItem, setSelectedMembersItem] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState(null);

  const openRankingDialog = (text) => {
    setRankingDialogText(text || '');
    setRankingDialogOpen(true);
  };

  const closeRankingDialog = () => {
    setRankingDialogOpen(false);
    setRankingDialogText('');
  };

  const handleOpenViewDetails = (item) => {
    setSelectedDetailsItem(item);
    setViewDetailsOpen(true);
  };

  const handleCloseViewDetails = () => {
    setViewDetailsOpen(false);
    setSelectedDetailsItem(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        date: formatDateOnly(formData.date),
      };

      if (editingItem) {
        await api.put(`/website-seo/${editingItem.id}`, payload);
      } else {
        await api.post('/website-seo', payload);
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
        await api.delete(`/website-seo/${id}`);
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
    if (data.length === 0) return {};
    
    const stats = {
      totalBlogs: data.reduce((sum, item) => sum + (item.blogs_posted || 0), 0),
      totalBacklinks: data.reduce((sum, item) => sum + (item.backlinks || 0), 0),
      totalChanges: data.reduce((sum, item) => sum + (item.changes_asked || 0), 0),
      avgDA: data.reduce((sum, item) => sum + (item.domain_authority || 0), 0) / data.length,
      avgPA: data.reduce((sum, item) => sum + (item.page_authority || 0), 0) / data.length,
      
      avgSiteHealth: data.reduce((sum, item) => sum + (item.site_health || 0), 0) / data.length,
      reportsSentCount: data.filter(item => item.reports_sent).length,
      rankingIssuesCount: data.filter(item => item.ranking_issues).length,
      totalGMBUpdates: data.reduce((sum, item) => sum + (item.gmb_updates || 0), 0),
      totalGMBChanges: data.reduce((sum, item) => sum + (item.gmb_changes_count || 0), 0),
      totalChangesAsked: data.reduce((sum, item) => sum + (item.changes_asked || 0), 0),
    };
    
    return stats;
  };

  const stats = calculateStats();

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
                  onClick={() => navigate('/add-seo-entry')}
                  fullWidth
                >
                  Add SEO Entry
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Ranking Issue Description Viewer Dialog */}
        <Dialog open={rankingDialogOpen} onClose={closeRankingDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Ranking Issue Details</DialogTitle>
          <DialogContent>
            <Typography variant="body1">{rankingDialogText || 'No description provided.'}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeRankingDialog}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Stats Cards */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Page Speed Scores</Typography>
                </Box>
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Page Speed on Mobile</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.avgDA || 0} 
                        sx={{ flexGrow: 1, mr: 1, height: 8 }} 
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {stats.avgDA ? stats.avgDA.toFixed(1) : 0}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Page Speed on the Desktop</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.avgPA || 0} 
                        sx={{ flexGrow: 1, mr: 1, height: 8 }} 
                        color="secondary"
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {stats.avgPA ? stats.avgPA.toFixed(1) : 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Content
                </Typography>
                <Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {stats.totalBlogs}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Blogs Posted
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Backlinks
                </Typography>
                <Box>
                  <Typography variant="h4" color="secondary" gutterBottom>
                    {stats.totalBacklinks}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Links
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Site Health
                </Typography>
                <Box>
                  <Typography variant="h4" gutterBottom sx={{ 
                    color: stats.avgSiteHealth >= 80 ? 'success.main' : stats.avgSiteHealth >= 60 ? 'warning.main' : 'error.main' 
                  }}>
                    {stats.avgSiteHealth ? stats.avgSiteHealth.toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Health
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOnIcon sx={{ color: '#ff9800', mr: 0.5 }} />
                  <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                    GMB Updates
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" gutterBottom sx={{ color: '#ff9800' }}>
                    {stats.totalGMBUpdates || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Updates
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(0, 150, 136, 0.1) 100%)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EditNoteIcon sx={{ color: '#2196f3', mr: 0.5 }} />
                  <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                    GMB Changes
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" gutterBottom sx={{ color: '#2196f3' }}>
                    {stats.totalGMBChanges || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Changes Count
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ListAltIcon sx={{ color: '#4caf50', mr: 0.5 }} />
                  <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                    Changes Asked
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" gutterBottom sx={{ color: '#4caf50' }}>
                    {stats.totalChangesAsked || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Items
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Status
                </Typography>
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip
                      icon={stats.reportsSentCount > 0 ? <CheckCircleIcon /> : <CancelIcon />}
                      label={`Reports: ${stats.reportsSentCount}/${data.length}`}
                      color={stats.reportsSentCount === data.length ? "success" : "default"}
                      size="small"
                    />
                    <Chip
                      icon={stats.rankingIssuesCount > 0 ? <CancelIcon /> : <CheckCircleIcon />}
                      label={`Ranking Issues: ${stats.rankingIssuesCount}`}
                      color={stats.rankingIssuesCount > 0 ? "error" : "success"}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Changes: {stats.totalChanges}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Page Speed Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="domain_authority" stroke="#0A58BF" name="Page Speed on Mobile" />
                  <Line type="monotone" dataKey="page_authority" stroke="#5505A6" name="Page Speed on the Desktop" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Activity Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="blogs_posted" fill="#0A58BF" name="Blogs" />
                  <Bar dataKey="backlinks" fill="#5505A6" name="Backlinks" />
                  <Bar dataKey="keyword_pass" fill="#3A7FD9" name="Keyword Ranking" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Data Table */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Website & SEO Data
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Team Member</TableCell>
                  <TableCell>Ranking Issue</TableCell>
                  <TableCell>Blogs</TableCell>
                  <TableCell>Backlinks</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.client_name}</TableCell>
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
                      <IconButton size="small" onClick={() => item.ranking_issues ? openRankingDialog(item.ranking_issues_description) : null}>
                        {item.ranking_issues ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{item.blogs_posted}</TableCell>
                    <TableCell>{item.backlinks}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenViewDetails(item)} title="View details">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {canEdit && (
                        <>
                          <IconButton size="small" onClick={() => handleOpenDialog(item)} title="Edit">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(item.id)} title="Delete">
                            <DeleteIcon fontSize="small" />
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
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingItem ? 'Edit Website SEO Entry' : 'Add Website SEO Entry'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Blogs Posted"
                  type="number"
                  value={formData.blogs_posted}
                  onChange={(e) => setFormData({ ...formData, blogs_posted: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Backlinks"
                  type="number"
                  value={formData.backlinks}
                  onChange={(e) => setFormData({ ...formData, backlinks: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GMB Updates"
                  type="number"
                  value={formData.gmb_updates}
                  onChange={(e) => setFormData({ ...formData, gmb_updates: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Keyword Ranking (count)"
                  type="number"
                  value={formData.keyword_pass}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 0;
                    const names = Array.from({ length: count }, (_, i) => formData.keyword_names[i] || '');
                    const positions = Array.from({ length: count }, (_, i) => formData.keyword_positions[i] || 0);
                    setFormData({ ...formData, keyword_pass: count, keyword_names: names, keyword_positions: positions });
                  }}
                  helperText="Enter number of keywords to provide names and positions"
                />
              </Grid>

              {formData.keyword_pass > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Keyword Details</Typography>
                  <Grid container spacing={2}>
                    {Array.from({ length: formData.keyword_pass }).map((_, idx) => (
                      <Grid container item xs={12} spacing={2} key={idx}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            placeholder={`Keyword ${idx + 1} Name`}
                            value={formData.keyword_names[idx] || ''}
                            onChange={(e) => {
                              const newNames = [...formData.keyword_names];
                              newNames[idx] = e.target.value;
                              setFormData({ ...formData, keyword_names: newNames });
                            }}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            placeholder={`Position`}
                            type="number"
                            value={formData.keyword_positions[idx] || ''}
                            onChange={(e) => {
                              const newPositions = [...formData.keyword_positions];
                              newPositions[idx] = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, keyword_positions: newPositions });
                            }}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Page Speed on Mobile: {formData.domain_authority}</Typography>
                <Slider
                  value={formData.domain_authority}
                  onChange={(_, value) => setFormData({ ...formData, domain_authority: value })}
                  min={0}
                  max={100}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Page Speed on the Desktop: {formData.page_authority}</Typography>
                <Slider
                  value={formData.page_authority}
                  onChange={(_, value) => setFormData({ ...formData, page_authority: value })}
                  min={0}
                  max={100}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Changes Asked (count)"
                  type="number"
                  value={formData.changes_asked}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 0;
                    const details = Array.from({ length: count }, (_, i) => formData.changes_asked_details[i] || '');
                    const statuses = Array.from({ length: count }, (_, i) => formData.changes_asked_statuses[i] || 'Not Done');
                    setFormData({ ...formData, changes_asked: count, changes_asked_details: details, changes_asked_statuses: statuses });
                  }}
                  helperText="Enter number of changes asked to provide details and status"
                />
              </Grid>

              {formData.changes_asked > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', m: 0 }}>Changes Asked Details & Status</Typography>
                    <Chip label={`${formData.changes_asked} items`} size="small" color="primary" variant="outlined" sx={{ ml: 'auto' }} />
                  </Box>
                  <Grid container spacing={2}>
                    {Array.from({ length: formData.changes_asked }).map((_, idx) => {
                      const status = formData.changes_asked_statuses[idx] || 'Not Done';
                      const getStatusColor = () => {
                        if (status === 'Done') return { bg: 'rgba(76, 175, 80, 0.2)', border: '2px solid #4caf50', shadow: '0 0 12px rgba(76, 175, 80, 0.3)' };
                        if (status === 'Working on it') return { bg: 'rgba(255, 193, 7, 0.2)', border: '2px solid #ffc107', shadow: '0 0 12px rgba(255, 193, 7, 0.3)' };
                        return { bg: 'rgba(244, 67, 54, 0.2)', border: '2px solid #f44336', shadow: '0 0 12px rgba(244, 67, 54, 0.3)' };
                      };
                      const colors = getStatusColor();
                      return (
                        <Grid item xs={12} md={6} key={idx}>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            alignItems: 'center',
                            p: 2.5,
                            bgcolor: colors.bg,
                            border: colors.border,
                            borderRadius: 1.5,
                            boxShadow: colors.shadow,
                            transition: 'all 0.3s ease, box-shadow 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: colors.shadow ? colors.shadow.replace('12px', '16px') : ''
                            }
                          }}>
                            <TextField
                              placeholder={`Describe change ${idx + 1}...`}
                              value={formData.changes_asked_details[idx] || ''}
                              onChange={(e) => {
                                const newDetails = [...formData.changes_asked_details];
                                newDetails[idx] = e.target.value;
                                setFormData({ ...formData, changes_asked_details: newDetails });
                              }}
                              variant="standard"
                              fullWidth
                              sx={{ 
                                flex: 1, 
                                mb: 0, 
                                '& input': { 
                                  fontSize: '0.95rem',
                                  fontWeight: 500
                                },
                                '& input::placeholder': {
                                  opacity: 0.6
                                }
                              }}
                              inputProps={{ style: { fontSize: '0.95rem' } }}
                            />
                            <Select
                              value={status}
                              onChange={(e) => {
                                const newStatuses = [...formData.changes_asked_statuses];
                                newStatuses[idx] = e.target.value;
                                setFormData({ ...formData, changes_asked_statuses: newStatuses });
                              }}
                              variant="standard"
                              sx={{ 
                                minWidth: 150,
                                '& .MuiSelect-select': {
                                  paddingBottom: 0,
                                  fontWeight: 600,
                                  fontSize: '0.95rem'
                                }
                              }}
                            >
                              <MenuItem value="Done">Done</MenuItem>
                              <MenuItem value="Working on it">Working on it</MenuItem>
                              <MenuItem value="Not Done">Not Done</MenuItem>
                            </Select>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Site Health: {formData.site_health}%</Typography>
                <Slider
                  value={formData.site_health}
                  onChange={(_, value) => setFormData({ ...formData, site_health: value })}
                  min={0}
                  max={100}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.ranking_issues}
                      onChange={(e) => setFormData({ ...formData, ranking_issues: e.target.checked })}
                    />
                  }
                  label="Ranking Issues"
                />
              </Grid>
              {formData.ranking_issues && (
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label="Ranking Issue Description"
                    multiline
                    rows={3}
                    value={formData.ranking_issues_description}
                    onChange={(e) => setFormData({ ...formData, ranking_issues_description: e.target.value })}
                  />
                </Grid>
              )}
              
              {/* GMB Changes Count */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GMB Changes (count)"
                  type="number"
                  value={formData.gmb_changes_count}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 0;
                    const details = Array.from({ length: count }, (_, i) => formData.gmb_changes_details[i] || '');
                    setFormData({ ...formData, gmb_changes_count: count, gmb_changes_details: details });
                  }}
                  helperText="Enter number of GMB changes to provide details for"
                />
              </Grid>

              {/* Dynamic GMB Changes Details */}
              {formData.gmb_changes_count > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>GMB Changes Details</Typography>
                  <Grid container spacing={2}>
                    {Array.from({ length: formData.gmb_changes_count }).map((_, idx) => (
                      <Grid item xs={12} md={6} key={idx}>
                        <TextField
                          fullWidth
                          label={`Change ${idx + 1}`}
                          value={formData.gmb_changes_details[idx] || ''}
                          onChange={(e) => {
                            const newDetails = [...formData.gmb_changes_details];
                            newDetails[idx] = e.target.value;
                            setFormData({ ...formData, gmb_changes_details: newDetails });
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.reports_sent}
                      onChange={(e) => setFormData({ ...formData, reports_sent: e.target.checked })}
                    />
                  }
                  label="Reports Sent"
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

        {/* View Details Modal */}
        <Dialog open={viewDetailsOpen} onClose={handleCloseViewDetails} maxWidth="md" fullWidth>
          <DialogTitle sx={{ 
            fontWeight: 700, 
            bgcolor: '#0f0f1e', 
            color: '#fff',
            fontSize: '1.3rem',
            pb: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            📊 Website & SEO Entry Details
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#1a1a2e', color: '#fff', pt: 3 }}>
            {selectedDetailsItem && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.date}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Client</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.client_name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Team Members</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {(() => {
                      const memberIds = selectedDetailsItem.team_member_ids || [];
                      if (memberIds.length === 0) return selectedDetailsItem.team_member_name || 'N/A';
                      return memberIds.map(id => getMemberName(id)).join(', ');
                    })()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Blogs Posted</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.blogs_posted}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Backlinks</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.backlinks}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Keyword Ranking</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.keyword_pass}</Typography>
                  {selectedDetailsItem.keyword_names && selectedDetailsItem.keyword_names.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {selectedDetailsItem.keyword_names.map((name, idx) => (
                        <Typography key={idx} variant="body2" sx={{ color: '#90caf9' }}>
                          • {name} (Position: {selectedDetailsItem.keyword_positions?.[idx] || 'N/A'})
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Page Speed (Mobile)</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.domain_authority}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Page Speed (Desktop)</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.page_authority}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Site Health</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.site_health}%</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Changes Asked</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.changes_asked}</Typography>
                </Grid>
                {selectedDetailsItem.changes_asked_details && selectedDetailsItem.changes_asked_details.length > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ width: 3, height: 16, bgcolor: '#ffc107', borderRadius: '50%' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Changes Details & Status</Typography>
                    </Box>
                    <Grid container spacing={1.5}>
                      {selectedDetailsItem.changes_asked_details.map((detail, idx) => {
                        const status = selectedDetailsItem.changes_asked_statuses?.[idx] || 'Not Done';
                        const getStatusColor = () => {
                          if (status === 'Done') return { bg: 'rgba(76, 175, 80, 0.2)', border: '1px solid #4caf50', color: '#4caf50' };
                          if (status === 'Working on it') return { bg: 'rgba(255, 193, 7, 0.2)', border: '1px solid #ffc107', color: '#ffc107' };
                          return { bg: 'rgba(244, 67, 54, 0.2)', border: '1px solid #f44336', color: '#f44336' };
                        };
                        const statusColor = getStatusColor();
                        return (
                          <Grid item xs={12} md={6} key={idx}>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, borderLeft: '4px solid #0A58BF' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{detail}</Typography>
                              <Chip 
                                label={status} 
                                size="small" 
                                sx={{ 
                                  bgcolor: statusColor.bg,
                                  border: statusColor.border,
                                  color: statusColor.color,
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">GMB Updates</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.gmb_updates || 0}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">GMB Changes Count</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedDetailsItem.gmb_changes_count || 0}</Typography>
                </Grid>
                {selectedDetailsItem.ranking_issues && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Ranking Issue Description</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, p: 1.5, bgcolor: 'rgba(244,67,54,0.15)', borderRadius: 1, border: '1px solid rgba(244,67,54,0.3)' }}>
                      {selectedDetailsItem.ranking_issues_description || 'N/A'}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Reports Sent</Typography>
                  <Chip label={selectedDetailsItem.reports_sent ? 'Yes' : 'No'} size="small" color={selectedDetailsItem.reports_sent ? 'success' : 'default'} />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#0f0f1e', p: 2 }}>
            <Button onClick={handleCloseViewDetails} sx={{ color: '#0A58BF' }}>Close</Button>
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

export default WebsiteSEOTab;