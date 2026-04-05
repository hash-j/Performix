import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import api from '../services/api';

const KpiBuilder = () => {
  const [kpis, setKpis] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('numeric');
  const [target, setTarget] = useState('');
  
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [industry, setIndustry] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const fetchKpis = async () => {
    try {
      const res = await api.get('/kpis/definitions');
      setKpis(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/kpis/definitions', { name, type, target_value: target });
      setName('');
      setTarget('');
      fetchKpis();
    } catch (err) {
      console.error(err);
      alert('Failed to create KPI. Check permissions.');
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm('Are you sure you want to drop this KPI? All data for it will be lost.')) return;
      await api.delete(`/kpis/definitions/${id}`);
      fetchKpis();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuggestKpis = async () => {
    if(!industry) return alert('Please enter your industry');
    setSuggesting(true);
    try {
      const res = await api.post('/ai/suggest-kpis', { industry });
      // Bulk create suggestions
      for (const kpi of res.data) {
         await api.post('/kpis/definitions', kpi);
      }
      fetchKpis();
      setSuggestModalOpen(false);
    } catch(err) {
      console.error(err);
      alert('Failed to generate suggestions. Ensure you have not hit plan limits.');
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" color="white" gutterBottom fontWeight="bold">KPI Builder</Typography>
          <Typography variant="body1" color="gray">Design custom metrics tailored exclusively for your company's SaaS dashboard.</Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<AutoAwesomeIcon />} 
          onClick={() => setSuggestModalOpen(true)}
          sx={{ color: '#F20505', borderColor: '#F20505', fontWeight: 'bold', '&:hover': { background: 'rgba(242, 5, 5, 0.1)', borderColor: '#F20505' } }}
        >
          AI Suggest KPIs
        </Button>
      </Box>
      
      <Paper sx={{ p: 4, mb: 4, bgcolor: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
        <Typography variant="h6" color="white" gutterBottom sx={{ mb: 3 }}>Create New Tracking Metric</Typography>
        <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', gap: 3, alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
          <TextField 
            label="Metric Name (e.g. Daily Sales)" 
            variant="outlined" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required 
            sx={{ input: { color: 'white' }, label: { color: 'gray' }, flex: 1.5, minWidth: '220px' }}
          />
          <FormControl sx={{ flex: 1, minWidth: '150px' }}>
            <InputLabel sx={{ color: 'gray' }}>Data Type</InputLabel>
            <Select 
              value={type} 
              label="Data Type" 
              onChange={(e) => setType(e.target.value)}
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              <MenuItem value="numeric">Numeric (#)</MenuItem>
              <MenuItem value="currency">Currency ($)</MenuItem>
              <MenuItem value="percentage">Percentage (%)</MenuItem>
            </Select>
          </FormControl>
          <TextField 
            label="Target Goal" 
            type="number" 
            variant="outlined" 
            value={target} 
            onChange={(e) => setTarget(e.target.value)}
            required 
            sx={{ input: { color: 'white' }, label: { color: 'gray' }, flex: 1, minWidth: '150px' }}
          />
          <Button type="submit" variant="contained" sx={{ height: '56px', px: 4, borderRadius: 2, background: 'linear-gradient(135deg, #F20505 0%, #8C0303 100%)', textTransform: 'none', fontWeight: 'bold' }}>
            Add Metric
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26, 26, 46, 0.4)', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'gray', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'gray', fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: 'gray', fontWeight: 'bold' }}>Target Value</TableCell>
              <TableCell align="right" sx={{ color: 'gray', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {kpis.map((kpi) => (
              <TableRow key={kpi.id}>
                <TableCell sx={{ color: 'white' }}>{kpi.name}</TableCell>
                <TableCell sx={{ color: 'white', textTransform: 'capitalize' }}>{kpi.type}</TableCell>
                <TableCell sx={{ color: 'white' }}>
                   {kpi.type === 'currency' ? '$' : ''}{kpi.target_value}{kpi.type === 'percentage' ? '%' : ''}
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(kpi.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {kpis.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'gray', py: 4 }}>
                  No metrics defined yet. Use the form above to build one!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* AI Suggestions Modal */}
      <Dialog open={suggestModalOpen} onClose={() => !suggesting && setSuggestModalOpen(false)} PaperProps={{ sx: { bgcolor: '#262626', color: 'white', minWidth: '400px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: '#F20505' }} /> AI KPI Generator
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="gray" mb={3} mt={1}>
            Tell us your industry, and our AI will automatically build the most important KPIs for you to track.
          </Typography>
          <TextField 
              fullWidth 
              label="E.g., SaaS, E-commerce, Marketing Agency" 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              sx={{ input: { color: 'white' }, label: { color: 'gray' }}}
              disabled={suggesting}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSuggestModalOpen(false)} color="inherit" disabled={suggesting}>Cancel</Button>
          <Button onClick={handleSuggestKpis} variant="contained" disabled={suggesting}>
             {suggesting ? <CircularProgress size={24} color="inherit" /> : 'Generate & Apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KpiBuilder;
