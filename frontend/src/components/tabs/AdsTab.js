import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
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
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Popover,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  Campaign as CampaignIcon,
  Handshake as HandshakeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { formatDateOnly } from '../../utils/dateFormatter';
import { AuthContext } from '../../context/AuthContext';

const platforms = ['Facebook ADS', 'Google ADS', 'Go High Level', 'Closings'];

const AdsTab = () => {
  const location = useLocation();
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
  
  // Get platform from URL query parameter
  const getInitialPlatformTab = () => {
    const searchParams = new URLSearchParams(location.search);
    const platformParam = searchParams.get('platform');
    if (platformParam === 'facebook') return 0;
    if (platformParam === 'google') return 1;
    if (platformParam === 'ghl') return 2;
    if (platformParam === 'closings') return 3;
    return 0;
  };
  
  const [platformTab, setPlatformTab] = useState(getInitialPlatformTab());
  const [formData, setFormData] = useState({
    client_id: '',
    team_member_ids: [],
    date: new Date(),
    platform: 'Facebook ADS',
    cost_per_lead: 0,
    quality_of_ads: 5,
    lead_quality: 5,
    closing_ratio: 0,
    quantity_leads: 0,
    keyword_refinement: 5,
    cost_per_click: 0,
    conversions: 0,
    closing: 0,
    tracking: 0,
  });

  useEffect(() => {
    fetchData();
    fetchClients();
    fetchTeamMembers();
  }, [startDate, endDate, selectedClient]);

  // Sync platformTab with URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const platformParam = searchParams.get('platform');
    if (platformParam === 'facebook') setPlatformTab(0);
    else if (platformParam === 'google') setPlatformTab(1);
    else if (platformParam === 'ghl') setPlatformTab(2);
    else if (platformParam === 'closings') setPlatformTab(3);
  }, [location.search]);

  const fetchData = async () => {
    try {
      const params = {
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(endDate),
      };
      if (selectedClient) params.clientId = selectedClient;
      
      const response = await api.get('/ads', { params });
      const formattedData = response.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching ads data:', error);
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

  const handleOpenDialog = (item = null, platform = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        client_id: item.client_id,
        team_member_ids: item.team_member_ids || (item.team_member_id ? [item.team_member_id] : []),
        date: new Date(item.date),
        platform: item.platform,
        cost_per_lead: item.cost_per_lead || 0,
        quality_of_ads: item.quality_of_ads || 5,
        lead_quality: item.lead_quality || 5,
        closing_ratio: item.closing_ratio || 0,
        quantity_leads: item.quantity_leads || 0,
        keyword_refinement: item.keyword_refinement || 5,
        cost_per_click: item.cost_per_click || 0,
        conversions: item.conversions || 0,
        closing: item.closing || 0,
        tracking: item.tracking || 0,
      });
    } else {
      setEditingItem(null);
      setFormData({
        client_id: '',
        team_member_ids: [],
        date: new Date(),
        platform: platform || 'Facebook ADS',
        cost_per_lead: 0,
        quality_of_ads: 5,
        lead_quality: 5,
        closing_ratio: 0,
        quantity_leads: 0,
        keyword_refinement: 5,
        cost_per_click: 0,
        conversions: 0,
        closing: 0,
        tracking: 0,
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
        await api.put(`/ads/${editingItem.id}`, payload);
      } else {
        await api.post('/ads', payload);
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
        await api.delete(`/ads/${id}`);
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

  const calculatePlatformStats = (platform) => {
    const platformData = data.filter(item => item.platform === platform);
    if (platformData.length === 0) return null;

    const stats = {
      totalLeads: platformData.reduce((sum, item) => sum + parseFloat(item.quantity_leads || 0), 0),
      totalConversions: platformData.reduce((sum, item) => sum + parseFloat(item.conversions || 0), 0),
      totalClosings: platformData.reduce((sum, item) => sum + parseFloat(item.closing || 0), 0),
      avgCostPerLead: platformData.reduce((sum, item) => sum + parseFloat(item.cost_per_lead || 0), 0) / platformData.length,
      avgCostPerClick: platformData.reduce((sum, item) => sum + parseFloat(item.cost_per_click || 0), 0) / platformData.length,
      avgQuality: platformData.reduce((sum, item) => sum + parseFloat(item.quality_of_ads || 0), 0) / platformData.length,
      avgLeadQuality: platformData.reduce((sum, item) => sum + parseFloat(item.lead_quality || 0), 0) / platformData.length,
      avgKeywordRefinement: platformData.reduce((sum, item) => sum + parseFloat(item.keyword_refinement || 0), 0) / platformData.length,
      totalTracking: platformData.reduce((sum, item) => sum + parseFloat(item.tracking || 0), 0),
      avgClosingRatio: platformData.reduce((sum, item) => sum + parseFloat(item.closing_ratio || 0), 0) / platformData.length,
    };

    stats.conversionRate = stats.totalLeads > 0 ? (stats.totalConversions / stats.totalLeads) * 100 : 0;
    stats.closingRate = stats.totalConversions > 0 ? (stats.totalClosings / stats.totalConversions) * 100 : 0;

    return stats;
  };

  const currentPlatform = platforms[platformTab];
  const platformData = data.filter(item => item.platform === currentPlatform);
  const currentStats = calculatePlatformStats(currentPlatform);

  // Platform-specific render methods
  const renderFacebookTab = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ color: '#0A58BF', mr: 1 }} />
                <Typography variant="h6">Avg CPC</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ${currentStats && typeof currentStats.avgCostPerClick === 'number' ? currentStats.avgCostPerClick.toFixed(2) : '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CampaignIcon sx={{ color: '#5505A6', mr: 1 }} />
                <Typography variant="h6">Total ADs</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#5505A6' }}>
                {currentStats?.totalLeads || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ color: '#3A7FD9', mr: 1 }} />
                <Typography variant="h6">Lead Quality</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#3A7FD9' }}>
                {currentStats?.avgLeadQuality ? currentStats.avgLeadQuality.toFixed(1) : '0'}/10
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HandshakeIcon sx={{ color: '#041A59', mr: 1 }} />
                <Typography variant="h6">Closing Ratio</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#041A59' }}>
                {currentStats && typeof currentStats.avgClosingRatio === 'number' ? currentStats.avgClosingRatio.toFixed(1) : '0'}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon sx={{ color: '#7B3FD1', mr: 1 }} />
                <Typography variant="h6">Ad Quality</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#7B3FD1' }}>
                {currentStats?.avgQuality ? currentStats.avgQuality.toFixed(1) : '0'}/10
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Cost Per Click Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cost_per_click" stroke="#0A58BF" name="Cost Per Click" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Quality of ADs vs Lead Quality</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quality_of_ads" fill="#7B3FD1" name="Ad Quality" />
                <Bar dataKey="lead_quality" fill="#3A7FD9" name="Lead Quality" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Facebook ADS Data</Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null, 'Facebook ADS')}>
              Add Entry
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Cost Per Click</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Lead Quality</TableCell>
                <TableCell>Closing Ratio</TableCell>
                <TableCell>Ad Quality</TableCell>
                <TableCell>Team Member</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {platformData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell>${item.cost_per_click || 0}</TableCell>
                  <TableCell>{item.quantity_leads || 0}</TableCell>
                  <TableCell>{item.lead_quality || 0}/10</TableCell>
                  <TableCell>{item.closing_ratio || 0}%</TableCell>
                  <TableCell>{item.quality_of_ads || 0}/10</TableCell>
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
    </Box>
  );

  const renderGoogleTab = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ color: '#0A58BF', mr: 1 }} />
                <Typography variant="h6">Keyword Refinement</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {currentStats?.avgKeywordRefinement ? currentStats.avgKeywordRefinement.toFixed(1) : '0'}/10
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ color: '#3A7FD9', mr: 1 }} />
                <Typography variant="h6">Avg Cost Per Click</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#3A7FD9' }}>
                ${currentStats?.avgCostPerClick ? currentStats.avgCostPerClick.toFixed(2) : '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HandshakeIcon sx={{ color: '#5505A6', mr: 1 }} />
                <Typography variant="h6">Total Conversions</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#5505A6' }}>
                {currentStats?.totalConversions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Keyword Refinement Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="keyword_refinement" stroke="#0A58BF" name="Keyword Refinement" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Cost Per Click vs Conversions</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cost_per_click" fill="#ff9800" name="Cost Per Click" />
                <Bar dataKey="conversions" fill="#4caf50" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Google ADS Data</Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null, 'Google ADS')}>
              Add Entry
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Keyword Refinement</TableCell>
                <TableCell>Cost Per Click</TableCell>
                <TableCell>Conversions</TableCell>
                <TableCell>Team Member</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {platformData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell>{item.keyword_refinement || 0}/10</TableCell>
                  <TableCell>${item.cost_per_click || 0}</TableCell>
                  <TableCell>{item.conversions || 0}</TableCell>
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
    </Box>
  );

  const renderGHLTab = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HandshakeIcon sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="h6">Total Closings</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#2196f3' }}>
                {currentStats?.totalClosings || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ color: '#4caf50', mr: 1 }} />
                <Typography variant="h6">Total Conversions</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50' }}>
                {currentStats?.totalConversions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CampaignIcon sx={{ color: '#ff9800', mr: 1 }} />
                <Typography variant="h6">Avg Tracking</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800' }}>
                {currentStats?.totalTracking ? (currentStats.totalTracking / platformData.length).toFixed(1) : '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Closings Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="closing" stroke="#2196f3" name="Closings" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Conversions vs Tracking</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="conversions" fill="#4caf50" name="Conversions" />
                <Bar dataKey="tracking" fill="#ff9800" name="Tracking" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Go High Level Data</Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null, 'Go High Level')}>
              Add Entry
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Closings</TableCell>
                <TableCell>Conversions</TableCell>
                <TableCell>Tracking</TableCell>
                <TableCell>Team Member</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {platformData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell>{item.closing || 0}</TableCell>
                  <TableCell>{item.conversions || 0}</TableCell>
                  <TableCell>{item.tracking || 0}</TableCell>
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
    </Box>
  );

  const renderClosingsTab = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HandshakeIcon sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="h6">Average Closing Ratio</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#2196f3' }}>
                {currentStats && typeof currentStats.avgClosingRatio === 'number' ? currentStats.avgClosingRatio.toFixed(1) : '0'}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={currentStats && typeof currentStats.avgClosingRatio === 'number' ? currentStats.avgClosingRatio : 0}
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Closing Ratio Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="closing_ratio" stroke="#2196f3" name="Closing Ratio %" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Closings Data</Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null, 'Closings')}>
              Add Entry
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Closing Ratio</TableCell>
                <TableCell>Team Member</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {platformData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell>{item.closing_ratio || 0}%</TableCell>
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
    </Box>
  );

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
            <Grid item xs={12} md={6}>
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
          </Grid>
        </Paper>

        {/* Platform Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={platformTab} onChange={(e, newValue) => setPlatformTab(newValue)}>
            <Tab label="Facebook ADS" icon={<FacebookIcon />} iconPosition="start" />
            <Tab label="Google ADS" icon={<GoogleIcon />} iconPosition="start" />
            <Tab label="Go High Level" icon={<CampaignIcon />} iconPosition="start" />
            <Tab label="Closings" icon={<HandshakeIcon />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {platformTab === 0 && renderFacebookTab()}
          {platformTab === 1 && renderGoogleTab()}
          {platformTab === 2 && renderGHLTab()}
          {platformTab === 3 && renderClosingsTab()}
        </Box>

        {/* Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingItem ? 'Edit Entry' : 'Add Entry'} - {formData.platform}</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
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

              {/* Facebook Specific Fields */}
              {formData.platform === 'Facebook ADS' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Cost Per Click"
                      type="number"
                      value={formData.cost_per_click}
                      onChange={(e) => setFormData({ ...formData, cost_per_click: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Quantity of ADs"
                      type="number"
                      value={formData.quantity_leads}
                      onChange={(e) => setFormData({ ...formData, quantity_leads: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography gutterBottom>Lead Quality: {formData.lead_quality}/10</Typography>
                    <Slider
                      value={formData.lead_quality}
                      onChange={(_, value) => setFormData({ ...formData, lead_quality: value })}
                      min={0}
                      max={10}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Closing Ratio (%)"
                      type="number"
                      value={formData.closing_ratio}
                      onChange={(e) => setFormData({ ...formData, closing_ratio: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography gutterBottom>Quality of ADs: {formData.quality_of_ads}/10</Typography>
                    <Slider
                      value={formData.quality_of_ads}
                      onChange={(_, value) => setFormData({ ...formData, quality_of_ads: value })}
                      min={0}
                      max={10}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </>
              )}

              {/* Google Specific Fields */}
              {formData.platform === 'Google ADS' && (
                <>
                  <Grid item xs={12}>
                    <Typography gutterBottom>Keyword Refinement: {formData.keyword_refinement}/10</Typography>
                    <Slider
                      value={formData.keyword_refinement}
                      onChange={(_, value) => setFormData({ ...formData, keyword_refinement: value })}
                      min={0}
                      max={10}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Cost Per Click"
                      type="number"
                      value={formData.cost_per_click}
                      onChange={(e) => setFormData({ ...formData, cost_per_click: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Conversions"
                      type="number"
                      value={formData.conversions}
                      onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                </>
              )}

              {/* GHL Specific Fields */}
              {formData.platform === 'Go High Level' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Closings"
                      type="number"
                      value={formData.closing}
                      onChange={(e) => setFormData({ ...formData, closing: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Conversions"
                      type="number"
                      value={formData.conversions}
                      onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tracking"
                      type="number"
                      value={formData.tracking}
                      onChange={(e) => setFormData({ ...formData, tracking: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                </>
              )}

              {/* Closings Specific Fields */}
              {formData.platform === 'Closings' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Closing Ratio (%)"
                    type="number"
                    value={formData.closing_ratio}
                    onChange={(e) => setFormData({ ...formData, closing_ratio: parseFloat(e.target.value) || 0 })}
                  />
                </Grid>
              )}
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

export default AdsTab;