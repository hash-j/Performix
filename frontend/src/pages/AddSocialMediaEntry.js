import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../services/api';
import { formatDateOnly } from '../utils/dateFormatter';
import { AuthContext } from '../context/AuthContext';

const platforms = ['Reddit', 'TikTok', 'Instagram', 'Facebook', 'YouTube'];

const AddSocialMediaEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const editingItem = location.state?.editingItem || null;

  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    team_member_ids: [],
    date: new Date(),
    platform: 'Instagram',
    quality_score: 5,
    quantity: 0,
    instagram_stories: 0,
    instagram_stories_quality: 5,
    instagram_posts: 0,
    instagram_posts_quality: 5,
    instagram_reels: 0,
    instagram_reels_quality: 5,
    facebook_stories: 0,
    facebook_stories_quality: 5,
    facebook_posts: 0,
    facebook_posts_quality: 5,
    facebook_reels: 0,
    facebook_reels_quality: 5,
    tiktok_stories: 0,
    tiktok_stories_quality: 5,
    tiktok_posts: 0,
    tiktok_posts_quality: 5,
    tiktok_reels: 0,
    tiktok_reels_quality: 5,
  });

  useEffect(() => {
    fetchClients();
    fetchTeamMembers();
    
    if (editingItem) {
      setFormData({
        client_id: editingItem.client_id,
        team_member_ids: editingItem.team_member_ids || (editingItem.team_member_id ? [editingItem.team_member_id] : []),
        date: new Date(editingItem.date),
        platform: editingItem.platform,
        quality_score: editingItem.quality_score || 5,
        quantity: editingItem.quantity || 0,
        instagram_stories: editingItem.instagram_stories || 0,
        instagram_stories_quality: editingItem.instagram_stories_quality || 5,
        instagram_posts: editingItem.instagram_posts || 0,
        instagram_posts_quality: editingItem.instagram_posts_quality || 5,
        instagram_reels: editingItem.instagram_reels || 0,
        instagram_reels_quality: editingItem.instagram_reels_quality || 5,
        facebook_stories: editingItem.facebook_stories || 0,
        facebook_stories_quality: editingItem.facebook_stories_quality || 5,
        facebook_posts: editingItem.facebook_posts || 0,
        facebook_posts_quality: editingItem.facebook_posts_quality || 5,
        facebook_reels: editingItem.facebook_reels || 0,
        facebook_reels_quality: editingItem.facebook_reels_quality || 5,
        tiktok_stories: editingItem.tiktok_stories || 0,
        tiktok_stories_quality: editingItem.tiktok_stories_quality || 5,
        tiktok_posts: editingItem.tiktok_posts || 0,
        tiktok_posts_quality: editingItem.tiktok_posts_quality || 5,
        tiktok_reels: editingItem.tiktok_reels || 0,
        tiktok_reels_quality: editingItem.tiktok_reels_quality || 5,
      });
    }
  }, [editingItem]);

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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        date: formatDateOnly(formData.date),
      };

      if (editingItem) {
        await api.put(`/social-media/${editingItem.id}`, payload);
      } else {
        await api.post('/social-media', payload);
      }

      navigate('/dashboard', { state: { activeTab: 'SocialMedia' } });
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f0f1e', p: 2 }}>
        <Container maxWidth="md">
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 3 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/dashboard')}
              sx={{ cursor: 'pointer', color: '#90caf9' }}
            >
              Dashboard
            </Link>
            <Typography color="textSecondary">
              {editingItem ? 'Edit Social Media Entry' : 'Add Social Media Entry'}
            </Typography>
          </Breadcrumbs>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Back
            </Button>
            <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>
              {editingItem ? 'Edit Social Media Entry' : 'Add New Social Media Entry'}
            </Typography>
          </Box>

          {/* Main Form */}
          <Paper sx={{ p: 3, bgcolor: '#1a1a2e' }}>
            <Grid container spacing={3}>
              {/* Client Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Client *</InputLabel>
                  <Select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    label="Client *"
                  >
                    <MenuItem value="">Select a client</MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Team Members */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Team Members</InputLabel>
                  <Select
                    multiple
                    value={formData.team_member_ids}
                    onChange={(e) => setFormData({ ...formData, team_member_ids: e.target.value })}
                    label="Team Members"
                  >
                    {teamMembers.map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date *"
                  value={formData.date}
                  onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              {/* Platform */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Platform *</InputLabel>
                  <Select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    label="Platform *"
                  >
                    {platforms.map((platform) => (
                      <MenuItem key={platform} value={platform}>
                        {platform}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Instagram Platform Fields */}
              {formData.platform === 'Instagram' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#90caf9', mb: 2 }}>
                      Instagram Details
                    </Typography>
                  </Grid>
                  
                  {/* Instagram Stories */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Stories (Quantity)"
                      type="number"
                      value={formData.instagram_stories}
                      onChange={(e) => setFormData({ ...formData, instagram_stories: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.instagram_stories_quality}/10</Typography>
                    <Slider
                      value={formData.instagram_stories_quality}
                      onChange={(_, value) => setFormData({ ...formData, instagram_stories_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>

                  {/* Instagram Posts */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Posts (Quantity)"
                      type="number"
                      value={formData.instagram_posts}
                      onChange={(e) => setFormData({ ...formData, instagram_posts: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.instagram_posts_quality}/10</Typography>
                    <Slider
                      value={formData.instagram_posts_quality}
                      onChange={(_, value) => setFormData({ ...formData, instagram_posts_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>

                  {/* Instagram Reels */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Reels (Quantity)"
                      type="number"
                      value={formData.instagram_reels}
                      onChange={(e) => setFormData({ ...formData, instagram_reels: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.instagram_reels_quality}/10</Typography>
                    <Slider
                      value={formData.instagram_reels_quality}
                      onChange={(_, value) => setFormData({ ...formData, instagram_reels_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>
                </>
              )}

              {/* Facebook Platform Fields */}
              {formData.platform === 'Facebook' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#90caf9', mb: 2 }}>
                      Facebook Details
                    </Typography>
                  </Grid>
                  
                  {/* Facebook Stories */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Stories (Quantity)"
                      type="number"
                      value={formData.facebook_stories}
                      onChange={(e) => setFormData({ ...formData, facebook_stories: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.facebook_stories_quality}/10</Typography>
                    <Slider
                      value={formData.facebook_stories_quality}
                      onChange={(_, value) => setFormData({ ...formData, facebook_stories_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>

                  {/* Facebook Posts */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Posts (Quantity)"
                      type="number"
                      value={formData.facebook_posts}
                      onChange={(e) => setFormData({ ...formData, facebook_posts: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.facebook_posts_quality}/10</Typography>
                    <Slider
                      value={formData.facebook_posts_quality}
                      onChange={(_, value) => setFormData({ ...formData, facebook_posts_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>

                  {/* Facebook Reels */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Reels (Quantity)"
                      type="number"
                      value={formData.facebook_reels}
                      onChange={(e) => setFormData({ ...formData, facebook_reels: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.facebook_reels_quality}/10</Typography>
                    <Slider
                      value={formData.facebook_reels_quality}
                      onChange={(_, value) => setFormData({ ...formData, facebook_reels_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>
                </>
              )}

              {/* TikTok Platform Fields */}
              {formData.platform === 'TikTok' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#90caf9', mb: 2 }}>
                      TikTok Details
                    </Typography>
                  </Grid>
                  
                  {/* TikTok Stories */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Stories (Quantity)"
                      type="number"
                      value={formData.tiktok_stories}
                      onChange={(e) => setFormData({ ...formData, tiktok_stories: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.tiktok_stories_quality}/10</Typography>
                    <Slider
                      value={formData.tiktok_stories_quality}
                      onChange={(_, value) => setFormData({ ...formData, tiktok_stories_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>

                  {/* TikTok Posts */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Posts (Quantity)"
                      type="number"
                      value={formData.tiktok_posts}
                      onChange={(e) => setFormData({ ...formData, tiktok_posts: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.tiktok_posts_quality}/10</Typography>
                    <Slider
                      value={formData.tiktok_posts_quality}
                      onChange={(_, value) => setFormData({ ...formData, tiktok_posts_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>

                  {/* TikTok Reels */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Reels (Quantity)"
                      type="number"
                      value={formData.tiktok_reels}
                      onChange={(e) => setFormData({ ...formData, tiktok_reels: parseInt(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: '#b0b0c0' }}>Quality: {formData.tiktok_reels_quality}/10</Typography>
                    <Slider
                      value={formData.tiktok_reels_quality}
                      onChange={(_, value) => setFormData({ ...formData, tiktok_reels_quality: value })}
                      min={0}
                      max={10}
                      step={1}
                      marks
                      size="small"
                    />
                  </Grid>
                </>
              )}

              {/* Quality Score - Only for Reddit and YouTube */}
              {(formData.platform === 'Reddit' || formData.platform === 'YouTube') && (
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Quality Score: <strong>{formData.quality_score}/10</strong>
                  </Typography>
                  <Slider
                    value={formData.quality_score}
                    onChange={(_, value) => setFormData({ ...formData, quality_score: value })}
                    min={0}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              )}

              {/* Quantity - Only for Reddit and YouTube */}
              {(formData.platform === 'Reddit' || formData.platform === 'YouTube') && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Quantity (Posts/Ads)"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={!formData.client_id || !formData.date}
                  >
                    {editingItem ? 'Update Entry' : 'Add Entry'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default AddSocialMediaEntry;
