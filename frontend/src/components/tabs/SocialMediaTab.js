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
  Avatar,
  Popover,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { formatDateOnly } from '../../utils/dateFormatter';
import { AuthContext } from '../../context/AuthContext';

const platforms = ['Reddit', 'TikTok', 'Instagram', 'Facebook', 'YouTube'];

const SocialMediaTab = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState('');
  const [membersPopoverAnchor, setMembersPopoverAnchor] = useState(null);
  const [selectedMembersItem, setSelectedMembersItem] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState(null);

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
      
      const response = await api.get('/social-media', { params });
      const formattedData = response.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching social media data:', error);
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

  const handleOpenDetailsDialog = (item) => {
    setSelectedDetailsItem(item);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedDetailsItem(null);
  };

  const handleEditClick = (item) => {
    navigate('/add-social-media', { state: { editingItem: item } });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await api.delete(`/social-media/${id}`);
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

  const calculatePlatformStats = () => {
    const stats = {};
    platforms.forEach(platform => {
      const platformData = data.filter(item => item.platform === platform);
      if (platformData.length > 0) {
        const totalQuality = platformData.reduce((sum, item) => sum + (item.quality_score || 0), 0);
        const totalQuantity = platformData.reduce((sum, item) => sum + (item.quantity || 0), 0);
        stats[platform] = {
          avgQuality: totalQuality / platformData.length,
          totalQuantity,
          entries: platformData.length,
        };
      }
    });
    return stats;
  };

  const platformStats = calculatePlatformStats();

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
                  onClick={() => navigate('/add-social-media')}
                  fullWidth
                >
                  Add Entry
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Platform Statistics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {Object.entries(platformStats).map(([platform, stats]) => (
            <Grid item xs={12} sm={6} md={2.4} key={platform}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {platform}
                  </Typography>
                  <Typography color="textSecondary">
                    Avg Quality: {stats.avgQuality.toFixed(1)}/10
                  </Typography>
                  <Typography color="textSecondary">
                    Total Posts: {stats.totalQuantity}
                  </Typography>
                  <Typography color="textSecondary">
                    Entries: {stats.entries}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Quality Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  {platforms.map((platform, index) => (
                    <Line
                      key={platform}
                      type="monotone"
                      dataKey="quality_score"
                      data={data.filter(d => d.platform === platform)}
                      name={`${platform} Quality`}
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Quantity by Platform
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(platformStats).map(([platform, stats]) => ({
                  platform,
                  quantity: stats.totalQuantity,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#0A58BF" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Data Table */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Social Media Data
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Platform</TableCell>
                  <TableCell>Quality (0-10)</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Team Member</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.client_name}</TableCell>
                    <TableCell>{item.platform}</TableCell>
                    <TableCell>
                      <Slider
                        value={item.quality_score}
                        min={0}
                        max={10}
                        step={1}
                        marks
                        size="small"
                        disabled
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
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
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpenDetailsDialog(item)} title="View Details">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canEdit && (
                          <>
                            <IconButton size="small" onClick={() => handleEditClick(item)} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(item.id)} title="Delete">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* View Details Dialog */}
        <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Social Media Entry Details</DialogTitle>
          <DialogContent>
            {selectedDetailsItem && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>Date</Typography>
                  <Typography>{selectedDetailsItem.date}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>Client</Typography>
                  <Typography>{selectedDetailsItem.client_name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>Platform</Typography>
                  <Typography>{selectedDetailsItem.platform}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>Combined Quality Score (Average)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{selectedDetailsItem.quality_score}/10</Typography>
                    <Box sx={{ width: 150 }}>
                      <Slider
                        value={selectedDetailsItem.quality_score}
                        min={0}
                        max={10}
                        step={1}
                        marks
                        disabled
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>Total Posts (All Types)</Typography>
                  <Typography>{selectedDetailsItem.quantity}</Typography>
                </Grid>

                {/* Instagram Details */}
                {selectedDetailsItem.platform === 'Instagram' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>Instagram Details</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Stories (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.instagram_stories || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.instagram_stories_quality || 0}/10</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Posts (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.instagram_posts || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.instagram_posts_quality || 0}/10</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Reels (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.instagram_reels || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.instagram_reels_quality || 0}/10</Typography>
                    </Grid>
                  </>
                )}

                {/* Facebook Details */}
                {selectedDetailsItem.platform === 'Facebook' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>Facebook Details</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Stories (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.facebook_stories || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.facebook_stories_quality || 0}/10</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Posts (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.facebook_posts || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.facebook_posts_quality || 0}/10</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Reels (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.facebook_reels || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.facebook_reels_quality || 0}/10</Typography>
                    </Grid>
                  </>
                )}

                {/* TikTok Details */}
                {selectedDetailsItem.platform === 'TikTok' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>TikTok Details</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Stories (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.tiktok_stories || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.tiktok_stories_quality || 0}/10</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Posts (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.tiktok_posts || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.tiktok_posts_quality || 0}/10</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Reels (Qty)</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedDetailsItem.tiktok_reels || 0}</Typography>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Quality: {selectedDetailsItem.tiktok_reels_quality || 0}/10</Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#90caf9', fontWeight: 600 }}>Team Members</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {(selectedDetailsItem.team_member_ids || []).length > 0 ? (
                      (selectedDetailsItem.team_member_ids || []).map((memberId) => (
                        <Box key={memberId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                          <Typography>{getMemberName(memberId)}</Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography color="textSecondary">No team members assigned</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            {canEdit && selectedDetailsItem && (
              <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                <Button onClick={() => { handleCloseDetailsDialog(); handleEditClick(selectedDetailsItem); }} variant="contained" startIcon={<EditIcon />}>
                  Edit
                </Button>
              </Box>
            )}
            <Button onClick={handleCloseDetailsDialog}>Close</Button>
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

export default SocialMediaTab;