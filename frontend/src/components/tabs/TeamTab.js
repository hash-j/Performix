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
  Rating,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Task as TaskIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import api from '../../services/api';
import { formatDateOnly } from '../../utils/dateFormatter';
import { AuthContext } from '../../context/AuthContext';
import TeamMemberContextMenu from '../common/TeamMemberContextMenu';

const TeamTab = () => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const [data, setData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState('');
  const [viewType, setViewType] = useState('overview'); // 'overview' or 'individual'
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    team_member_id: '',
    date: new Date(),
    tasks_assigned: 0,
    tasks_completed: 0,
    quality_score: 5,
    responsibility_score: 5,
    punctuality_score: 0,
  });
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const [selectedContextMember, setSelectedContextMember] = useState(null);
  
  useEffect(() => {
    fetchData();
    fetchTeamMembersData();
  }, [startDate, endDate, selectedMember]);

  const fetchData = async () => {
    try {
      const params = {
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(endDate),
      };
      if (selectedMember) params.teamMemberId = selectedMember;
      
      const response = await api.get('/team-kpis', { params });
      const formattedData = response.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const fetchTeamMembersData = async () => {
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
        team_member_id: item.team_member_id,
        date: new Date(item.date),
        tasks_assigned: item.tasks_assigned,
        tasks_completed: item.tasks_completed,
        quality_score: item.quality_score,
        responsibility_score: item.responsibility_score,
        punctuality_score: item.punctuality_score,
      });
    } else {
      setEditingItem(null);
      setFormData({
        team_member_id: '',
        date: new Date(),
        tasks_assigned: 0,
        tasks_completed: 0,
        quality_score: 5,
        responsibility_score: 5,
        punctuality_score: 0,
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
        await api.put(`/team-kpis/${editingItem.id}`, payload);
      } else {
        await api.post('/team-kpis', payload);
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
        await api.delete(`/team-kpis/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  const calculateMemberStats = (memberId) => {
    const memberData = data.filter(item => item.team_member_id === memberId);
    if (memberData.length === 0) return null;

    const stats = {
      totalAssigned: memberData.reduce((sum, item) => sum + (item.tasks_assigned || 0), 0),
      totalCompleted: memberData.reduce((sum, item) => sum + (item.tasks_completed || 0), 0),
      avgQuality: memberData.reduce((sum, item) => sum + (item.quality_score || 0), 0) / memberData.length,
      avgResponsibility: memberData.reduce((sum, item) => sum + (item.responsibility_score || 0), 0) / memberData.length,
      avgPunctuality: memberData.reduce((sum, item) => sum + (item.punctuality_score || 0), 0) / memberData.length,
      completionRate: memberData.reduce((sum, item) => sum + (item.tasks_completed || 0), 0) / 
                     memberData.reduce((sum, item) => sum + (item.tasks_assigned || 0), 0) * 100 || 0,
      recentPerformance: memberData.slice(-1)[0] || {},
    };

    return stats;
  };

  const calculateOverallStats = () => {
    if (data.length === 0) return {};
    
    const stats = {
      totalMembers: teamMembers.length,
      activeMembers: [...new Set(data.map(item => item.team_member_id))].length,
      totalTasksAssigned: data.reduce((sum, item) => sum + (item.tasks_assigned || 0), 0),
      totalTasksCompleted: data.reduce((sum, item) => sum + (item.tasks_completed || 0), 0),
      avgQuality: data.reduce((sum, item) => sum + (item.quality_score || 0), 0) / data.length,
      avgResponsibility: data.reduce((sum, item) => sum + (item.responsibility_score || 0), 0) / data.length,
      avgPunctuality: data.reduce((sum, item) => sum + (item.punctuality_score || 0), 0) / data.length,
    };
    
    stats.completionRate = stats.totalTasksAssigned > 0 ? 
      (stats.totalTasksCompleted / stats.totalTasksAssigned) * 100 : 0;
    
    // Calculate top performers
    const memberPerformance = teamMembers.map(member => {
      const memberStats = calculateMemberStats(member.id);
      return {
        ...member,
        performance: memberStats ? memberStats.completionRate : 0,
        stats: memberStats,
      };
    }).filter(member => member.performance > 0);

    stats.topPerformers = memberPerformance
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 3);

    return stats;
  };

  const overallStats = calculateOverallStats();

  const memberPerformanceData = teamMembers.map(member => {
    const stats = calculateMemberStats(member.id);
    return {
      member: member.name,
      completionRate: stats ? stats.completionRate : 0,
      quality: stats ? stats.avgQuality : 0,
      responsibility: stats ? stats.avgResponsibility : 0,
      punctuality: stats ? stats.avgPunctuality : 0,
    };
  }).filter(item => item.completionRate > 0);

  const radarData = memberPerformanceData.slice(0, 3).map(item => ({
    subject: item.member,
    'Completion Rate': item.completionRate,
    'Quality': item.quality * 10, // Scale to match other metrics
    'Responsibility': item.responsibility * 10,
    'Punctuality': item.punctuality,
    fullMark: 100,
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f0f1e', p: 2 }}>
        {/* Filters and Controls */}
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
                <InputLabel>Team Member</InputLabel>
                <Select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  label="Team Member"
                >
                  <MenuItem value="">All Members</MenuItem>
                  {teamMembers.map((member) => (
                    <MenuItem 
                      key={member.id} 
                      value={member.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedContextMember(member);
                        setContextMenuAnchor(e.currentTarget);
                      }}
                    >
                      {member.name}
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
                  Add Team KPI Entry
                </Button>
              )}
            </Grid>
            <Grid item xs={12}>
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={(e, newValue) => newValue && setViewType(newValue)}
                sx={{ mt: 1 }}
              >
                <ToggleButton value="overview">
                  Overview
                </ToggleButton>
                <ToggleButton value="individual">
                  Individual Performance
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </Paper>

        {/* Overall Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TaskIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Task Completion</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {overallStats.completionRate ? overallStats.completionRate.toFixed(1) : 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={overallStats.completionRate || 0} 
                    sx={{ height: 8, borderRadius: 4 }}
                    color={overallStats.completionRate > 90 ? "success" : overallStats.completionRate > 70 ? "warning" : "error"}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {overallStats.totalTasksCompleted}/{overallStats.totalTasksAssigned} tasks
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon sx={{ color: '#ff9800', mr: 1 }} />
                  <Typography variant="h6">Quality Score</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4" sx={{ color: '#ff9800' }}>
                      {overallStats.avgQuality ? overallStats.avgQuality.toFixed(1) : 0}
                    </Typography>
                    <Typography variant="h6" sx={{ ml: 1, color: 'text.secondary' }}>
                      /10
                    </Typography>
                  </Box>
                  <Rating
                    value={overallStats.avgQuality / 2}
                    precision={0.5}
                    readOnly
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Average Quality
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ color: '#4caf50', mr: 1 }} />
                  <Typography variant="h6">Team Activity</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ color: '#4caf50' }} gutterBottom>
                    {overallStats.activeMembers}/{overallStats.totalMembers}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Members
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon sx={{ color: '#0A58BF', mr: 1 }} />
                  <Typography variant="h6">Punctuality</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ color: '#0A58BF' }} gutterBottom>
                    {overallStats.avgPunctuality ? overallStats.avgPunctuality.toFixed(1) : 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Score
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Performers */}
        {viewType === 'overview' && overallStats.topPerformers && overallStats.topPerformers.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Top Performers
                </Typography>
                <Grid container spacing={2}>
                  {overallStats.topPerformers.map((member, index) => (
                    <Grid item xs={12} sm={6} md={4} key={member.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ 
                              width: 48, 
                              height: 48, 
                              mr: 2,
                              bgcolor: index === 0 ? '#ffd700' : 
                                      index === 1 ? '#c0c0c0' : 
                                      index === 2 ? '#cd7f32' : '#0A58BF'
                            }}>
                              <Typography variant="h6">
                                {index + 1}
                              </Typography>
                            </Avatar>
                            <Box>
                              <Typography variant="h6">
                                {member.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {member.email}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                              Completion Rate
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={member.performance}
                              sx={{ height: 8, borderRadius: 3 }}
                              color={member.performance > 90 ? "success" : member.performance > 70 ? "warning" : "error"}
                            />
                            <Typography variant="body2" align="right">
                              {member.performance.toFixed(1)}%
                            </Typography>
                          </Box>

                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">
                                Quality
                              </Typography>
                              <Typography variant="body1">
                                {member.stats?.avgQuality ? member.stats.avgQuality.toFixed(1) : 0}/10
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">
                                Responsibility
                              </Typography>
                              <Typography variant="body1">
                                {member.stats?.avgResponsibility ? member.stats.avgResponsibility.toFixed(1) : 0}/10
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={viewType === 'overview' ? 8 : 12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viewType === 'overview' ? 'Team Performance Trends' : 'Individual Performance Trends'}
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="tasks_completed"
                    stroke="#0A58BF"
                    name="Tasks Completed"
                  />
                  {viewType === 'individual' && selectedMember && (
                    <>
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="quality_score"
                        stroke="#5505A6"
                        name="Quality Score"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="responsibility_score"
                        stroke="#3A7FD9"
                        name="Responsibility Score"
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {viewType === 'overview' && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Top Performers Radar
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name={radarData[0]?.subject}
                      dataKey={radarData[0]?.subject === radarData[0]?.subject ? 'Completion Rate' : 'Quality'}
                      stroke="#0A58BF"
                      fill="#0A58BF"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name={radarData[1]?.subject}
                      dataKey={radarData[1]?.subject === radarData[1]?.subject ? 'Completion Rate' : 'Quality'}
                      stroke="#5505A6"
                      fill="#5505A6"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Individual Member View */}
        {viewType === 'individual' && selectedMember && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {teamMembers
              .filter(member => member.id === selectedMember)
              .map(member => {
                const stats = calculateMemberStats(member.id);
                if (!stats) return null;

                return (
                  <Grid item xs={12} key={member.id}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {member.name}'s Performance Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Task Completion
                              </Typography>
                              <Typography variant="h4">
                                {stats.completionRate.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2">
                                {stats.totalCompleted}/{stats.totalAssigned} tasks
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Quality Score
                              </Typography>
                              <Typography variant="h4">
                                {stats.avgQuality.toFixed(1)}/10
                              </Typography>
                              <Rating
                                value={stats.avgQuality / 2}
                                precision={0.5}
                                readOnly
                                size="small"
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Responsibility
                              </Typography>
                              <Typography variant="h4">
                                {stats.avgResponsibility.toFixed(1)}/10
                              </Typography>
                              <Typography variant="body2">
                                Reliability score
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Punctuality
                              </Typography>
                              <Typography variant="h4">
                                {stats.avgPunctuality.toFixed(1)}
                              </Typography>
                              <Typography variant="body2">
                                On-time performance
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}
          </Grid>
        )}

        {/* Data Table */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Team KPI Data
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Team Member</TableCell>
                  <TableCell>Tasks Assigned</TableCell>
                  <TableCell>Tasks Completed</TableCell>
                  <TableCell>Completion Rate</TableCell>
                  <TableCell>Quality</TableCell>
                  <TableCell>Responsibility</TableCell>
                  <TableCell>Punctuality</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => {
                  const completionRate = item.tasks_assigned > 0 ? 
                    (item.tasks_completed / item.tasks_assigned) * 100 : 0;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.team_member_name}</TableCell>
                      <TableCell>{item.tasks_assigned}</TableCell>
                      <TableCell>{item.tasks_completed}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={completionRate}
                            sx={{ width: 60, height: 8 }}
                            color={completionRate > 90 ? "success" : completionRate > 70 ? "warning" : "error"}
                          />
                          <Typography variant="body2">
                            {completionRate.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Slider
                            value={item.quality_score}
                            min={0}
                            max={10}
                            step={1}
                            marks
                            size="small"
                            disabled
                            sx={{ width: 80 }}
                          />
                          <Typography variant="body2">
                            {item.quality_score}/10
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Slider
                            value={item.responsibility_score}
                            min={0}
                            max={10}
                            step={1}
                            marks
                            size="small"
                            disabled
                            sx={{ width: 80 }}
                          />
                          <Typography variant="body2">
                            {item.responsibility_score}/10
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.punctuality_score}
                          size="small"
                          color={item.punctuality_score > 8 ? "success" : item.punctuality_score > 6 ? "warning" : "error"}
                        />
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingItem ? 'Edit Team KPI Entry' : 'Add Team KPI Entry'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Team Member</InputLabel>
                  <Select
                    value={formData.team_member_id}
                    onChange={(e) => setFormData({ ...formData, team_member_id: e.target.value })}
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tasks Assigned"
                  type="number"
                  value={formData.tasks_assigned}
                  onChange={(e) => setFormData({ ...formData, tasks_assigned: parseInt(e.target.value) || 0 })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tasks Completed"
                  type="number"
                  value={formData.tasks_completed}
                  onChange={(e) => setFormData({ ...formData, tasks_completed: parseInt(e.target.value) || 0 })}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>Quality Score: {formData.quality_score}/10</Typography>
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

              <Grid item xs={12}>
                <Typography gutterBottom>Responsibility Score: {formData.responsibility_score}/10</Typography>
                <Slider
                  value={formData.responsibility_score}
                  onChange={(_, value) => setFormData({ ...formData, responsibility_score: value })}
                  min={0}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>Punctuality Score: {formData.punctuality_score}/10</Typography>
                <Slider
                  value={formData.punctuality_score}
                  onChange={(_, value) => setFormData({ ...formData, punctuality_score: value })}
                  min={0}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
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
        
        {/* Team Member Context Menu */}
        <TeamMemberContextMenu
          open={Boolean(contextMenuAnchor)}
          anchorEl={contextMenuAnchor}
          onClose={() => {
            setContextMenuAnchor(null);
            setSelectedContextMember(null);
          }}
          member={selectedContextMember}
          onMemberUpdated={fetchTeamMembersData}
          onMemberDeleted={() => {
            setSelectedMember('');
            fetchTeamMembersData();
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default TeamTab;