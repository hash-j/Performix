import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import api from '../services/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const [kpis, setKpis] = useState([]);
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [openModal, setOpenModal] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [logValue, setLogValue] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchData = async () => {
    try {
        setLoading(true);
        const [kpiRes, entriesRes, insightsRes] = await Promise.all([
          api.get('/kpis/definitions'),
          api.get('/kpis/entries'),
          api.get('/ai/insights')
        ]);
        setKpis(kpiRes.data);
        setEntries(entriesRes.data);
        setInsights(insightsRes.data.insights || []);
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (kpi) => {
      setSelectedKpi(kpi);
      setLogValue('');
      setLogNotes('');
      setOpenModal(true);
  };

  const handleLogData = async () => {
      try {
          await api.post('/kpis/entries', {
              kpi_id: selectedKpi.id,
              date: logDate,
              value: Number(logValue),
              notes: logNotes
          });
          setOpenModal(false);
          fetchData();
      } catch (err) {
          console.error(err);
          alert('Failed to log data');
      }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box>


      {/* AI Insights Widget */}
      {insights.length > 0 && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: '#400106', borderRadius: 3, border: '1px solid #8C0303' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AutoAwesomeIcon sx={{ color: '#F20505' }} />
                  <Typography variant="h6" color="white" fontWeight="bold">AI Smart Insights</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {insights.map((insight, idx) => (
                      <Typography key={idx} variant="body1" color="white" dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
              </Box>
          </Paper>
      )}

      {kpis.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#1a1a2e', borderRadius: 3 }}>
              <Typography variant="h6" color="gray">No KPIs defined yet.</Typography>
              <Typography variant="body2" color="gray" mb={2}>Head over to the KPI Builder to start tracking your company's metrics.</Typography>
              <Button variant="contained" href="/kpi-builder">Go to Builder</Button>
          </Paper>
      ) : (
          <Grid container spacing={3}>
            {kpis.map(kpi => {
              // Get data for this KPI and reverse so it goes chronological
              const kpiData = entries.filter(e => e.kpi_id === kpi.id).reverse().map(e => ({
                  name: format(new Date(e.date), 'MMM dd'),
                  value: Number(e.value)
              }));

              const formatValue = (val) => {
                  if (kpi.type === 'currency') return `$${Number(val).toLocaleString()}`;
                  if (kpi.type === 'percentage') return `${val}%`;
                  return Number(val).toLocaleString();
              };

              const latestValue = kpiData.length > 0 ? kpiData[kpiData.length - 1].value : 0;
              const targetVal = Number(kpi.target_value);
              const progressPercentage = targetVal > 0 ? Math.min((latestValue / targetVal) * 100, 100) : 0;

              return (
                  <Grid item xs={12} md={6} lg={6} key={kpi.id}>
                      <Paper sx={{ 
                          p: 3, 
                          bgcolor: 'rgba(26, 26, 46, 0.8)', 
                          backdropFilter: 'blur(10px)',
                          borderRadius: 4, 
                          height: '420px', 
                          display: 'flex', 
                          flexDirection: 'column',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ width: '100%' }}>
                                  <Typography variant="subtitle1" color="gray" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>{kpi.name}</Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                                      <Typography variant="h3" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #F20505 0%, #ff8080 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                          {formatValue(latestValue)}
                                      </Typography>
                                      <Button 
                                        variant="contained" 
                                        size="small" 
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpenModal(kpi)}
                                        sx={{ borderRadius: '20px', background: 'linear-gradient(135deg, #F20505 0%, #8C0303 100%)', textTransform: 'none' }}
                                      >
                                        Log Entry
                                      </Button>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 0.5 }}>
                                      <Typography variant="caption" color="gray">Progress</Typography>
                                      <Typography variant="caption" color="white" fontWeight="bold">Target: {formatValue(targetVal)}</Typography>
                                  </Box>
                                  <LinearProgress 
                                      variant="determinate" 
                                      value={progressPercentage} 
                                      sx={{ 
                                          height: 8, 
                                          borderRadius: 4, 
                                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                                          '& .MuiLinearProgress-bar': {
                                              background: 'linear-gradient(90deg, #F20505 0%, #8C0303 100%)'
                                          }
                                      }} 
                                  />
                              </Box>
                          </Box>
                          
                          <Box sx={{ flexGrow: 1, minHeight: 0, mt: 3 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={kpiData}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                                      <XAxis dataKey="name" stroke="#6b6b80" tick={{fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                                      <YAxis stroke="#6b6b80" tick={{fontSize: 11}} axisLine={false} tickLine={false} dx={-10} />
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(15, 15, 30, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} 
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                      />
                                      <Line type="monotone" dataKey="value" stroke="url(#colorUv)" strokeWidth={4} dot={{ r: 4, fill: '#F20505', strokeWidth: 0 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} />
                                      <defs>
                                          <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                                              <stop offset="0%" stopColor="#F20505" />
                                              <stop offset="100%" stopColor="#8C0303" />
                                          </linearGradient>
                                      </defs>
                                  </LineChart>
                              </ResponsiveContainer>
                          </Box>
                      </Paper>
                  </Grid>
              );
            })}
          </Grid>
      )}

      {/* Performance Logs Table */}
      {entries.length > 0 && (
          <Paper sx={{ 
              mt: 5, 
              p: 3, 
              bgcolor: 'rgba(26, 26, 46, 0.8)', 
              backdropFilter: 'blur(10px)',
              borderRadius: 4, 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" color="white" fontWeight="bold">Recent Performance Logs</Typography>
                  <Typography variant="body2" color="gray">Total Logs: {entries.length}</Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 400, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' } }}>
                  <Table stickyHeader>
                      <TableHead>
                          <TableRow>
                              <TableCell sx={{ bgcolor: 'rgba(15, 15, 30, 0.95)', color: 'gray', fontWeight: 'bold' }}>Date</TableCell>
                              <TableCell sx={{ bgcolor: 'rgba(15, 15, 30, 0.95)', color: 'gray', fontWeight: 'bold' }}>Metric</TableCell>
                              <TableCell sx={{ bgcolor: 'rgba(15, 15, 30, 0.95)', color: 'gray', fontWeight: 'bold' }}>Value Logged</TableCell>
                              <TableCell sx={{ bgcolor: 'rgba(15, 15, 30, 0.95)', color: 'gray', fontWeight: 'bold' }}>Logged By (Team)</TableCell>
                              <TableCell sx={{ bgcolor: 'rgba(15, 15, 30, 0.95)', color: 'gray', fontWeight: 'bold' }}>Notes</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {entries.slice(0, 50).map((entry) => {
                              const formatValue = (val) => {
                                  if (entry.type === 'currency') return `$${Number(val).toLocaleString()}`;
                                  if (entry.type === 'percentage') return `${val}%`;
                                  return Number(val).toLocaleString();
                              };
                              return (
                                  <TableRow key={entry.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                      <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.05)' }}>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                                      <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.05)' }}>
                                          <Chip label={entry.name} size="small" sx={{ bgcolor: 'rgba(242, 5, 5, 0.2)', color: '#ff4d4d', fontWeight: 'bold' }} />
                                      </TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold', borderColor: 'rgba(255,255,255,0.05)' }}>{formatValue(entry.value)}</TableCell>
                                      <TableCell sx={{ color: 'gray', borderColor: 'rgba(255,255,255,0.05)' }}>{entry.author_name || 'System'}</TableCell>
                                      <TableCell sx={{ color: 'gray', borderColor: 'rgba(255,255,255,0.05)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {entry.notes || '-'}
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                      </TableBody>
                  </Table>
              </TableContainer>
          </Paper>
      )}

      {/* Log Data Modal */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        PaperProps={{ 
            sx: { 
                bgcolor: '#1a1a2e', 
                color: 'white', 
                minWidth: '400px', 
                borderRadius: 4,
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.05)'
            } 
        }}
      >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Log Entry</Typography>
              <Typography variant="subtitle2" color="primary.light" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{selectedKpi?.name}</Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 3 }}>
              <TextField 
                  fullWidth 
                  label="Log Date" 
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  sx={{ mb: 3, input: { color: 'white' }, label: { color: 'gray' }}}
              />
              <TextField 
                  fullWidth 
                  label={`Log Value (${selectedKpi?.type === 'percentage' ? '%' : selectedKpi?.type === 'currency' ? '$' : '#'})`} 
                  type="number"
                  value={logValue}
                  onChange={(e) => setLogValue(e.target.value)}
                  InputProps={{
                      startAdornment: selectedKpi?.type === 'currency' ? <InputAdornment position="start" sx={{ '& p': { color: 'gray' } }}>$</InputAdornment> : null,
                      endAdornment: selectedKpi?.type === 'percentage' ? <InputAdornment position="end" sx={{ '& p': { color: 'gray' } }}>%</InputAdornment> : null,
                  }}
                  sx={{ mb: 3, input: { color: 'white' }, label: { color: 'gray' }}}
              />
              <TextField
                  fullWidth
                  label="Notes (Optional)"
                  multiline
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="E.g., Ran a 20% discount promotion today."
                  sx={{ input: { color: 'white' }, label: { color: 'gray' }, '& .MuiInputBase-input': { color: 'white' } }}
              />
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Button onClick={() => setOpenModal(false)} color="inherit" sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
              <Button 
                onClick={handleLogData} 
                variant="contained" 
                disabled={!logValue}
                sx={{ 
                    background: 'linear-gradient(135deg, #F20505 0%, #8C0303 100%)', 
                    borderRadius: 2, 
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'bold'
                }}
              >
                Save Entry
              </Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;