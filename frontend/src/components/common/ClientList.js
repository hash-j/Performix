import React, { useState, useContext } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  Typography,
  Chip,
} from '@mui/material';
import ClientContextMenu from './ClientContextMenu';
import { AuthContext } from '../../context/AuthContext';

const ClientList = ({ clients, selectedClient, onSelectClient, onClientUpdated, onClientDeleted }) => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const [selectedContextClient, setSelectedContextClient] = useState(null);

  const handleContextMenu = (e, client) => {
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setSelectedContextClient(client);
    setContextMenuAnchor(e.currentTarget);
  };

  const handleListItemClick = (clientId) => {
    onSelectClient(clientId);
  };

  return (
    <Box>
      <Paper sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <List sx={{ py: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              selected={selectedClient === ''}
              onClick={() => handleListItemClick('')}
              sx={{
                py: 1,
                px: 2,
                backgroundColor: selectedClient === '' ? 'rgba(10, 88, 191, 0.12)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(10, 88, 191, 0.12)',
                },
              }}
            >
              <Typography variant="body2">All Clients</Typography>
            </ListItemButton>
          </ListItem>
          {clients.map((client) => (
            <ListItem
              key={client.id}
              disablePadding
              onContextMenu={(e) => handleContextMenu(e, client)}
            >
              <ListItemButton
                selected={selectedClient === client.id}
                onClick={() => handleListItemClick(client.id)}
                sx={{
                  py: 1,
                  px: 2,
                  backgroundColor: selectedClient === client.id ? 'rgba(10, 88, 191, 0.12)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(10, 88, 191, 0.12)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {client.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    (Right-click for options)
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Client Context Menu */}
      <ClientContextMenu
        open={Boolean(contextMenuAnchor)}
        anchorEl={contextMenuAnchor}
        onClose={() => {
          setContextMenuAnchor(null);
          setSelectedContextClient(null);
        }}
        client={selectedContextClient}
        onClientUpdated={onClientUpdated}
        onClientDeleted={onClientDeleted}
      />
    </Box>
  );
};

export default ClientList;
