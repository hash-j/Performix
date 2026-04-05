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
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Chip,
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

const AddSEOEntry = () => {
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
  });

  useEffect(() => {
    fetchClients();
    fetchTeamMembers();
    
    if (editingItem) {
      setFormData({
        client_id: editingItem.client_id,
        team_member_ids: editingItem.team_member_ids || (editingItem.team_member_id ? [editingItem.team_member_id] : []),
        date: new Date(editingItem.date),
        changes_asked: editingItem.changes_asked,
        changes_asked_details: editingItem.changes_asked_details || [],
        changes_asked_statuses: editingItem.changes_asked_statuses || [],
        blogs_posted: editingItem.blogs_posted,
        ranking_issues: editingItem.ranking_issues,
        reports_sent: editingItem.reports_sent,
        ranking_issues_description: editingItem.ranking_issues_description || '',
        backlinks: editingItem.backlinks,
        domain_authority: editingItem.domain_authority,
        page_authority: editingItem.page_authority,
        keyword_pass: editingItem.keyword_pass,
        keyword_names: editingItem.keyword_names || [],
        keyword_positions: editingItem.keyword_positions || [],
        site_health: editingItem.site_health,
        gmb_updates: editingItem.gmb_updates || 0,
        gmb_changes_count: editingItem.gmb_changes_count || 0,
        gmb_changes_details: editingItem.gmb_changes_details || [],
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
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }

    setLoading(true);
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

      navigate('/dashboard?tab=website-seo');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard?tab=website-seo');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f0f1e', pt: 4, pb: 4 }}>
        <Container maxWidth="lg">
          {/* Breadcrumb Navigation */}
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/dashboard?tab=website-seo')}
                sx={{ cursor: 'pointer', color: 'primary.main' }}
              >
                Website & SEO Data
              </Link>
              <Typography color="textSecondary">
                {editingItem ? 'Edit SEO Entry' : 'Add New SEO Entry'}
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleCancel}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              {editingItem ? 'Edit Website & SEO Data' : 'Add New Website & SEO Data'}
            </Typography>
          </Box>

          {/* Main Form Card */}
          <Card sx={{ bgcolor: '#0f0f1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                {/* Client Selection */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Client</InputLabel>
                    <Select
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      label="Client"
                    >
                      <MenuItem value="">Select a Client</MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date Selection */}
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                {/* Team Members Multi-Select */}
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

                {/* Divider */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                    Content & Links
                  </Typography>
                </Grid>

                {/* Content Fields */}
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
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                              <TextField
                                placeholder={`Keyword ${idx + 1} Name`}
                                value={formData.keyword_names[idx] || ''}
                                onChange={(e) => {
                                  const newNames = [...formData.keyword_names];
                                  newNames[idx] = e.target.value;
                                  setFormData({ ...formData, keyword_names: newNames });
                                }}
                                size="small"
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                              <TextField
                                placeholder={`Position`}
                                type="number"
                                value={formData.keyword_positions[idx] || ''}
                                onChange={(e) => {
                                  const newPositions = [...formData.keyword_positions];
                                  newPositions[idx] = parseInt(e.target.value) || 0;
                                  setFormData({ ...formData, keyword_positions: newPositions });
                                }}
                                size="small"
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}

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
                      <Box sx={{ 
                        width: 4, 
                        height: 24, 
                        bgcolor: 'primary.main', 
                        borderRadius: 1 
                      }} />
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
                                placeholder={`Change ${idx + 1}`}
                                value={formData.changes_asked_details[idx] || ''}
                                onChange={(e) => {
                                  const newDetails = [...formData.changes_asked_details];
                                  newDetails[idx] = e.target.value;
                                  setFormData({ ...formData, changes_asked_details: newDetails });
                                }}
                                variant="standard"
                                sx={{ flex: 1, mb: 0 }}
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
                                  minWidth: 130,
                                  '& .MuiSelect-select': {
                                    paddingBottom: 0
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

                

                {/* Divider */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                    Performance Metrics
                  </Typography>
                </Grid>

                {/* Page Speed on Mobile */}
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Page Speed on Mobile: <strong>{formData.domain_authority}</strong>
                  </Typography>
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

                {/* Page Speed on Desktop */}
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Page Speed on the Desktop: <strong>{formData.page_authority}</strong>
                  </Typography>
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

                {/* Site Health */}
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Site Health: <strong>{formData.site_health}%</strong>
                  </Typography>
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

                

                {/* Divider */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                    Additional Information
                  </Typography>
                </Grid>

                {/* Ranking Issues */}
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

                {/* Reports Sent */}
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

                {/* Ranking Issue Description */}
                {formData.ranking_issues && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ranking Issue Description"
                      multiline
                      rows={4}
                      value={formData.ranking_issues_description}
                      onChange={(e) => setFormData({ ...formData, ranking_issues_description: e.target.value })}
                      placeholder="Describe the ranking issues you encountered..."
                    />
                  </Grid>
                )}

                

                

                {/* Action Buttons */}
                <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit}
                    disabled={loading || !formData.client_id}
                  >
                    {loading ? 'Saving...' : editingItem ? 'Update Entry' : 'Add Entry'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default AddSEOEntry;
