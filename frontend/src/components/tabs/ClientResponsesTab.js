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
  Rating,
  Avatar,
  TextareaAutosize,
  Popover,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { formatDateOnly } from '../../utils/dateFormatter';
import { AuthContext } from '../../context/AuthContext';

const ClientResponsesTab = () => {
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
    review_rating: 3,
    review_comment: '',
    miscellaneous_work: '',
  });
  const [miscWorkModalOpen, setMiscWorkModalOpen] = useState(false);
  const [selectedMiscWork, setSelectedMiscWork] = useState(null);
  const [membersPopoverAnchor, setMembersPopoverAnchor] = useState(null);
  const [selectedMembersItem, setSelectedMembersItem] = useState(null);

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
      
      const response = await api.get('/responses', { params });
      const formattedData = response.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching client responses data:', error);
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
        review_rating: item.review_rating,
        review_comment: item.review_comment || '',
        miscellaneous_work: item.miscellaneous_work || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        client_id: '',
        team_member_ids: [],
        date: new Date(),
        review_rating: 3,
        review_comment: '',
        miscellaneous_work: '',
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
        await api.put(`/responses/${editingItem.id}`, payload);
      } else {
        await api.post('/responses', payload);
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
        await api.delete(`/responses/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  const handleOpenMiscWorkModal = (item) => {
    setSelectedMiscWork(item);
    setMiscWorkModalOpen(true);
  };

  const handleCloseMiscWorkModal = () => {
    setMiscWorkModalOpen(false);
    setSelectedMiscWork(null);
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

  const getMembersDisplay = (item) => {
    const memberIds = item.team_member_ids || [];
    if (memberIds.length === 0) {
      return item.team_member_name || 'N/A';
    }
    if (memberIds.length === 1) {
      return getMemberName(memberIds[0]);
    }
    return null; // Will show "View Members" button
  };

  const calculateStats = () => {
    if (data.length === 0) return {};
    
    const reviews = data.filter(item => item.review_rating > 0);
    const stats = {
      totalReviews: reviews.length,
      avgRating: reviews.reduce((sum, item) => sum + (item.review_rating || 0), 0) / reviews.length || 0,
      totalMiscWork: data.filter(item => item.miscellaneous_work && item.miscellaneous_work.trim() !== '').length,
      ratingDistribution: {
        1: reviews.filter(item => item.review_rating === 1).length,
        2: reviews.filter(item => item.review_rating === 2).length,
        3: reviews.filter(item => item.review_rating === 3).length,
        4: reviews.filter(item => item.review_rating === 4).length,
        5: reviews.filter(item => item.review_rating === 5).length,
      },
    };
    
    return stats;
  };

  const stats = calculateStats();

  const ratingData = [
    { name: '5 Stars', value: stats.ratingDistribution?.[5] || 0, color: '#4caf50' },
    { name: '4 Stars', value: stats.ratingDistribution?.[4] || 0, color: '#8bc34a' },
    { name: '3 Stars', value: stats.ratingDistribution?.[3] || 0, color: '#ffeb3b' },
    { name: '2 Stars', value: stats.ratingDistribution?.[2] || 0, color: '#ff9800' },
    { name: '1 Star', value: stats.ratingDistribution?.[1] || 0, color: '#f44336' },
  ].filter(item => item.value > 0);

  const getRatingIcon = (rating) => {
    if (rating >= 4) return <ThumbUpIcon color="success" />;
    if (rating >= 3) return <SentimentSatisfiedIcon color="warning" />;
    return <ThumbDownIcon color="error" />;
  };

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
                  Add Response Entry
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StarIcon sx={{ color: '#ff9800', mr: 1 }} />
                  <Typography variant="h6">Average Rating</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h3" color="primary">
                    {stats.avgRating ? stats.avgRating.toFixed(1) : 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Based on {stats.totalReviews} reviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CommentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Reviews</Typography>
                </Box>
                <Typography variant="h3" color="primary" gutterBottom>
                  {stats.totalReviews}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Client Feedback Received
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ThumbUpIcon sx={{ color: '#4caf50', mr: 1 }} />
                  <Typography variant="h6">Positive Reviews</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: '#4caf50' }} gutterBottom>
                  {stats.ratingDistribution?.[4] + stats.ratingDistribution?.[5] || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  4+ Star Ratings
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SentimentDissatisfiedIcon sx={{ color: '#f44336', mr: 1 }} />
                  <Typography variant="h6">Miscellaneous Work</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: '#f44336' }} gutterBottom>
                  {stats.totalMiscWork}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Unclassified Tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Rating Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(stats.ratingDistribution || {}).map(([rating, count]) => ({
                  rating: `${rating} Star${rating === '1' ? '' : 's'}`,
                  count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0A58BF" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Rating Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ratingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ratingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Recent Reviews */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Reviews & Feedback
              </Typography>
              <Grid container spacing={2}>
                {data
                  .filter(item => item.review_rating > 0)
                  .slice(0, 8)
                  .map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ width: 40, height: 40, mr: 1, bgcolor: '#0A58BF' }}>
                              {item.client_name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {item.client_name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatDateOnly(item.date)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getRatingIcon(item.review_rating)}
                            <Rating
                              value={item.review_rating}
                              readOnly
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          {item.review_comment && (
                            <Typography variant="body2" sx={{ 
                              fontStyle: 'italic',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              "{item.review_comment}"
                            </Typography>
                          )}
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            {canEdit && (
                              <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Data Table */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Client Responses Data
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Review Rating</TableCell>
                  <TableCell>Review Comment</TableCell>
                  <TableCell>Miscellaneous Work</TableCell>
                  <TableCell>Team Member</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDateOnly(item.date)}</TableCell>
                    <TableCell>{item.client_name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRatingIcon(item.review_rating)}
                        <Rating
                          value={item.review_rating}
                          readOnly
                          size="small"
                        />
                        <Typography variant="body2">
                          ({item.review_rating}/5)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {item.review_comment ? (
                        <Typography
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.review_comment}
                        </Typography>
                      ) : (
                        <Chip label="No comment" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.miscellaneous_work ? (
                        <Chip
                          label="Has work"
                          size="small"
                          color="secondary"
                          variant="outlined"
                          onClick={() => handleOpenMiscWorkModal(item)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <Chip label="None" size="small" variant="outlined" />
                      )}
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
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingItem ? 'Edit Client Response Entry' : 'Add Client Response Entry'}
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
                  renderInput={(params) => <TextField {...params} fullWidth sx={{ '& .MuiOutlinedInput-root': { height: '56px' } }} />}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ mr: 2 }}>
                    Review Rating:
                  </Typography>
                  <Rating
                    value={formData.review_rating}
                    onChange={(_, value) => setFormData({ ...formData, review_rating: value })}
                    precision={1}
                  />
                  <Typography variant="body1" sx={{ ml: 2 }}>
                    {formData.review_rating}/5
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Review Comment
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.review_comment}
                  onChange={(e) => setFormData({ ...formData, review_comment: e.target.value })}
                  placeholder="Enter client review or feedback..."
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Miscellaneous Work
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.miscellaneous_work}
                  onChange={(e) => setFormData({ ...formData, miscellaneous_work: e.target.value })}
                  placeholder="Describe any uncategorized work..."
                  variant="outlined"
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

        {/* Miscellaneous Work Modal */}
        <Dialog 
          open={miscWorkModalOpen} 
          onClose={handleCloseMiscWorkModal} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: '#0f0f1e',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <SentimentDissatisfiedIcon sx={{ mr: 1, color: '#f44336' }} />
            Miscellaneous Work Details
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {selectedMiscWork && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Client
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedMiscWork.client_name}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDateOnly(selectedMiscWork.date)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Team Member
                  </Typography>
                  <Typography variant="body1">
                    {selectedMiscWork.team_member_name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Work Details
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#0f0f1e',
                      minHeight: 100,
                      maxHeight: 300,
                      overflowY: 'auto'
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedMiscWork.miscellaneous_work}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', pt: 2 }}>
            <Button onClick={handleCloseMiscWorkModal} variant="contained">
              Close
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

export default ClientResponsesTab;