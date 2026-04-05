import React, { useState, useEffect, useContext } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Task as TaskIcon,
  Email as EmailIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  Public as PublicIcon,
  ThumbUp as ThumbUpIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api';
import { formatDateOnly } from '../../utils/dateFormatter';
import ClientContextMenu from '../common/ClientContextMenu';
import { AuthContext } from '../../context/AuthContext';

const OverviewTab = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [overviewData, setOverviewData] = useState({
    socialMedia: {},
    websiteSEO: {},
    ads: {},
    email: {},
    responses: {},
    team: {},
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const [selectedContextClient, setSelectedContextClient] = useState(null);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetchClients();
    if (currentUser?.role === 'admin') {
      fetchUserCount();
    }
  }, [currentUser]);

  useEffect(() => {
    if (clients.length > 0) {
      fetchOverviewData();
    }
  }, [clients, selectedClient, startDate, endDate]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchUserCount = async () => {
    try {
      const response = await api.get('/auth/users');
      setUserCount(response.data.length || 0);
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  };

  const handleManageUsers = () => {
    window.open('/users-management', '_blank');
  };

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(endDate),
      };
      if (selectedClient) params.clientId = selectedClient;

      // Fetch all data in parallel
      const [
        socialMediaRes,
        websiteSeoRes,
        adsRes,
        emailRes,
        responsesRes,
        teamRes,
      ] = await Promise.all([
        api.get('/social-media', { params }),
        api.get('/website-seo', { params }),
        api.get('/ads', { params }),
        api.get('/email', { params }),
        api.get('/responses', { params }),
        api.get('/team-kpis', { params }),
      ]);

      setOverviewData({
        socialMedia: calculateSocialMediaStats(socialMediaRes.data),
        websiteSEO: calculateWebsiteSEOStats(websiteSeoRes.data),
        ads: calculateAdsStats(adsRes.data),
        email: calculateEmailStats(emailRes.data),
        responses: calculateResponsesStats(responsesRes.data),
        team: calculateTeamStats(teamRes.data),
      });

      // Combine recent activities - format dates before mapping
      const formattedSocialMedia = socialMediaRes.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      const formattedWebsiteSeo = websiteSeoRes.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      const formattedAds = adsRes.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      const formattedEmail = emailRes.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));
      const formattedResponses = responsesRes.data.map(item => ({
        ...item,
        date: formatDateOnly(item.date)
      }));

      const activities = [
        ...formattedSocialMedia.slice(-5).map(item => ({
          type: 'social-media',
          icon: <PublicIcon />,
          title: `${item.platform} Activity`,
          description: `${item.quantity} posts, Quality: ${item.quality_score}/10`,
          date: item.date,
          client: item.client_name,
        })),
        ...formattedWebsiteSeo.slice(-5).map(item => ({
          type: 'website-seo',
          icon: <TrendingUpIcon />,
          title: 'SEO Update',
          description: `Blogs: ${item.blogs_posted}, Backlinks: ${item.backlinks}`,
          date: item.date,
          client: item.client_name,
        })),
        ...formattedAds.slice(-5).map(item => ({
          type: 'ads',
          icon: <CampaignIcon />,
          title: `${item.platform} Campaign`,
          description: `Leads: ${item.quantity_leads || item.conversions || 0}`,
          date: item.date,
          client: item.client_name,
        })),
        ...formattedEmail.slice(-5).map(item => ({
          type: 'email',
          icon: <EmailIcon />,
          title: 'Email Campaign',
          description: `Sent: ${item.emails_sent}, Opens: ${parseFloat(item.opening_ratio || 0).toFixed(2)}%`,
          date: item.date,
          client: item.client_name,
        })),
        ...formattedResponses.slice(-5).map(item => ({
          type: 'responses',
          icon: <StarIcon />,
          title: 'Client Review',
          description: `Rating: ${item.review_rating}/5`,
          date: item.date,
          client: item.client_name,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSocialMediaStats = (data) => {
    if (data.length === 0) return {};
    
    const totalPosts = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const avgQuality = data.reduce((sum, item) => sum + (item.quality_score || 0), 0) / data.length;
    const platforms = ['Reddit', 'TikTok', 'Instagram', 'Facebook', 'YouTube'];
    const platformData = platforms.map(platform => {
      const platformItems = data.filter(item => item.platform === platform);
      return {
        platform,
        posts: platformItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
        quality: platformItems.reduce((sum, item) => sum + (item.quality_score || 0), 0) / platformItems.length || 0,
      };
    });

    return {
      totalPosts,
      avgQuality,
      platformData,
    };
  };

  const calculateWebsiteSEOStats = (data) => {
    if (data.length === 0) return {};
    
    return {
      totalBlogs: data.reduce((sum, item) => sum + (item.blogs_posted || 0), 0),
      totalBacklinks: data.reduce((sum, item) => sum + (item.backlinks || 0), 0),
      avgDA: data.reduce((sum, item) => sum + (item.domain_authority || 0), 0) / data.length,
      avgPA: data.reduce((sum, item) => sum + (item.page_authority || 0), 0) / data.length,
    };
  };

  const calculateAdsStats = (data) => {
    if (data.length === 0) return {};
    
    const platforms = ['Facebook ADS', 'Google ADS', 'Go High Level', 'Closings'];
    const platformStats = platforms.map(platform => {
      const platformItems = data.filter(item => item.platform === platform);
      return {
        platform,
        leads: platformItems.reduce((sum, item) => sum + (item.quantity_leads || 0), 0),
        conversions: platformItems.reduce((sum, item) => sum + (item.conversions || 0), 0),
        closings: platformItems.reduce((sum, item) => sum + (item.closing || 0), 0),
      };
    });

    return {
      totalLeads: platformStats.reduce((sum, item) => sum + item.leads, 0),
      totalConversions: platformStats.reduce((sum, item) => sum + item.conversions, 0),
      platformStats,
    };
  };

  const calculateEmailStats = (data) => {
    if (data.length === 0) return {};
    
    // Filter out items with null or undefined opening_ratio for average calculation
    const validOpeningRatios = data.filter(item => item.opening_ratio !== null && item.opening_ratio !== undefined && item.opening_ratio > 0);
    
    return {
      totalEmails: data.reduce((sum, item) => sum + (item.emails_sent || 0), 0),
      avgOpeningRatio: validOpeningRatios.length > 0 ? 
        validOpeningRatios.reduce((sum, item) => sum + parseFloat(item.opening_ratio || 0), 0) / validOpeningRatios.length : 0,
      avgQuality: data.reduce((sum, item) => sum + (item.template_quality || 0), 0) / data.length,
    };
  };

  const calculateResponsesStats = (data) => {
    if (data.length === 0) return {};
    
    const reviews = data.filter(item => item.review_rating > 0);
    return {
      totalReviews: reviews.length,
      avgRating: reviews.reduce((sum, item) => sum + (item.review_rating || 0), 0) / reviews.length || 0,
      miscWork: data.filter(item => item.miscellaneous_work && item.miscellaneous_work.trim() !== '').length,
    };
  };

  const calculateTeamStats = (data) => {
    if (data.length === 0) return {};
    
    return {
      totalTasksAssigned: data.reduce((sum, item) => sum + (item.tasks_assigned || 0), 0),
      totalTasksCompleted: data.reduce((sum, item) => sum + (item.tasks_completed || 0), 0),
      avgQuality: data.reduce((sum, item) => sum + (item.quality_score || 0), 0) / data.length,
      completionRate: data.reduce((sum, item) => sum + (item.tasks_assigned || 0), 0) > 0 ?
        (data.reduce((sum, item) => sum + (item.tasks_completed || 0), 0) / 
         data.reduce((sum, item) => sum + (item.tasks_assigned || 0), 0)) * 100 : 0,
    };
  };

  const kpiCards = [
    {
      title: 'Social Media',
      value: overviewData.socialMedia.totalPosts || 0,
      subtitle: 'Total Posts',
      icon: <PublicIcon />,
      color: '#0A58BF',
      progress: overviewData.socialMedia.avgQuality ? (overviewData.socialMedia.avgQuality / 10) * 100 : 0,
      progressLabel: 'Avg Quality',
    },
    {
      title: 'Website SEO',
      value: overviewData.websiteSEO.totalBlogs || 0,
      subtitle: 'Blogs Posted',
      icon: <TrendingUpIcon />,
      color: '#4caf50',
      progress: overviewData.websiteSEO.avgDA || 0,
      progressLabel: 'Avg Page Speed on Mobile',
    },
    {
      title: 'ADS & Closings',
      value: overviewData.ads.totalConversions || 0,
      subtitle: 'Total Conversions',
      icon: <CampaignIcon />,
      color: '#ff9800',
      progress: overviewData.ads.totalLeads > 0 ? 
        (overviewData.ads.totalConversions / overviewData.ads.totalLeads) * 100 : 0,
      progressLabel: 'Conversion Rate',
    },
    {
      title: 'Email Marketing',
      value: overviewData.email.totalEmails ? (overviewData.email.totalEmails / 1000).toFixed(1) + 'K' : '0',
      subtitle: 'Emails Sent',
      icon: <EmailIcon />,
      color: '#9c27b0',
      progress: overviewData.email.avgOpeningRatio || 0,
      progressLabel: 'Avg Opening Ratio',
    },
    {
      title: 'Client Responses',
      value: overviewData.responses.avgRating ? overviewData.responses.avgRating.toFixed(1) : '0',
      subtitle: 'Avg Rating',
      icon: <StarIcon />,
      color: '#ff5722',
      progress: (overviewData.responses.avgRating / 5) * 100 || 0,
      progressLabel: 'Satisfaction Score',
    },
    {
      title: 'Team Perf',
      value: overviewData.team.completionRate ? overviewData.team.completionRate.toFixed(1) + '%' : '0%',
      subtitle: 'Task Completion',
      icon: <PeopleIcon />,
      color: '#2196f3',
      progress: overviewData.team.avgQuality ? (overviewData.team.avgQuality / 10) * 100 : 0,
      progressLabel: 'Avg Quality Score',
    },
  ];

  const socialMediaChartData = overviewData.socialMedia.platformData || [];

  const platformPerformanceData = [
    {
      name: 'Facebook',
      leads: overviewData.ads.platformStats?.find(p => p.platform === 'Facebook ADS')?.leads || 0,
      conversions: overviewData.ads.platformStats?.find(p => p.platform === 'Facebook ADS')?.conversions || 0,
    },
    {
      name: 'Google',
      leads: overviewData.ads.platformStats?.find(p => p.platform === 'Google ADS')?.leads || 0,
      conversions: overviewData.ads.platformStats?.find(p => p.platform === 'Google ADS')?.conversions || 0,
    },
    {
      name: 'GHL',
      leads: overviewData.ads.platformStats?.find(p => p.platform === 'Go High Level')?.leads || 0,
      conversions: overviewData.ads.platformStats?.find(p => p.platform === 'Go High Level')?.conversions || 0,
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f0f1e', p: 2 }}>
        {/* Header and Filters */}
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  label="Client"
                >
                  <MenuItem value="">All Clients</MenuItem>
                  {clients.map((client) => (
                    <MenuItem 
                      key={client.id} 
                      value={client.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedContextClient(client);
                        setContextMenuAnchor(e.currentTarget);
                      }}
                    >
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchOverviewData}
                fullWidth
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {kpiCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">{card.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {card.subtitle}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: card.color }}>
                      {card.icon}
                    </Avatar>
                  </Box>
                  <Typography variant="h4" gutterBottom>
                    {card.value}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={card.progress}
                      sx={{ height: 6, borderRadius: 3, mb: 1 }}
                      color={card.progress > 80 ? "success" : card.progress > 60 ? "warning" : "error"}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {card.progressLabel}: {card.progress.toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Social Media Performance */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Social Media Performance by Platform
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={socialMediaChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="posts" fill="#0A58BF" name="Posts" />
                  <Bar dataKey="quality" fill="#4caf50" name="Quality Score" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Platform Performance */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                ADS Platform Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={platformPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#ff9800"
                    fill="#ff9800"
                    fillOpacity={0.3}
                    name="Leads"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#4caf50"
                    fill="#4caf50"
                    fillOpacity={0.3}
                    name="Conversions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* SEO & Email Performance */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                SEO Authority
              </Typography>
              <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    {overviewData.websiteSEO.avgDA ? overviewData.websiteSEO.avgDA.toFixed(1) : 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Page Speed on Mobile
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={overviewData.websiteSEO.avgDA || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Page Speed on the Desktop: {overviewData.websiteSEO.avgPA ? overviewData.websiteSEO.avgPA.toFixed(1) : 0}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Email Performance
              </Typography>
              <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Opening Ratio
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={overviewData.email.avgOpeningRatio || 0}
                    sx={{ height: 10, borderRadius: 5 }}
                    color={overviewData.email.avgOpeningRatio > 50 ? "success" : "warning"}
                  />
                  <Typography variant="h4" align="center" sx={{ mt: 1 }}>
                    {overviewData.email.avgOpeningRatio ? overviewData.email.avgOpeningRatio.toFixed(1) : 0}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Template Quality
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(overviewData.email.avgQuality / 10) * 100 || 0}
                    sx={{ height: 10, borderRadius: 5 }}
                    color="secondary"
                  />
                  <Typography variant="h4" align="center" sx={{ mt: 1 }}>
                    {overviewData.email.avgQuality ? overviewData.email.avgQuality.toFixed(1) : 0}/10
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Client Satisfaction
              </Typography>
              <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <StarIcon sx={{ color: '#ff9800', fontSize: 48 }} />
                    <Typography variant="h2" sx={{ ml: 1 }}>
                      {overviewData.responses.avgRating ? overviewData.responses.avgRating.toFixed(1) : 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Average Rating
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Based on {overviewData.responses.totalReviews || 0} reviews
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Recent Activities */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Activity</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {activity.date}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={activity.icon}
                            label={activity.type.replace('-', ' ').toUpperCase()}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {activity.client}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {activity.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {activity.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" align="center">
                        {overviewData.websiteSEO.totalBacklinks || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" align="center">
                        Backlinks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" align="center">
                        {overviewData.responses.miscWork || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" align="center">
                        Misc Tasks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" align="center" color="success.main">
                        {overviewData.team.totalTasksCompleted || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" align="center">
                        Tasks Done
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" align="center" color="warning.main">
                        {overviewData.team.totalTasksAssigned - overviewData.team.totalTasksCompleted || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" align="center">
                        Pending Tasks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* User Management Button - Admin Only */}
                {currentUser?.role === 'admin' && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ backgroundColor: 'rgba(10, 88, 191, 0.1)', borderColor: '#0A58BF' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <GroupIcon sx={{ color: '#0A58BF', fontSize: 28 }} />
                          <Box>
                            <Typography variant="h4" sx={{ color: '#0A58BF' }}>
                              {userCount}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Users Created
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          fullWidth
                          onClick={handleManageUsers}
                          startIcon={<GroupIcon />}
                        >
                          Manage Users
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Summary
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Overall Completion Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={overviewData.team.completionRate || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                    color={overviewData.team.completionRate > 90 ? "success" : overviewData.team.completionRate > 70 ? "warning" : "error"}
                  />
                  <Typography variant="body2" align="right">
                    {overviewData.team.completionRate ? overviewData.team.completionRate.toFixed(1) : 0}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Overall Quality Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(overviewData.team.avgQuality / 10) * 100 || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="secondary"
                  />
                  <Typography variant="body2" align="right">
                    {overviewData.team.avgQuality ? overviewData.team.avgQuality.toFixed(1) : 0}/10
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Client Context Menu */}
        <ClientContextMenu
          open={Boolean(contextMenuAnchor)}
          anchorEl={contextMenuAnchor}
          onClose={() => {
            setContextMenuAnchor(null);
            setSelectedContextClient(null);
          }}
          client={selectedContextClient}
          onClientUpdated={fetchClients}
          onClientDeleted={() => {
            setSelectedClient('');
            fetchClients();
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default OverviewTab;