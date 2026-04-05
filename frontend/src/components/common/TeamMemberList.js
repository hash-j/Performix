import React, { useState, useContext } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from '@mui/material';
import TeamMemberContextMenu from './TeamMemberContextMenu';
import { AuthContext } from '../../context/AuthContext';

const TeamMemberList = ({ members, selectedMember, onSelectMember, onMemberUpdated, onMemberDeleted }) => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const [selectedContextMember, setSelectedContextMember] = useState(null);

  const handleContextMenu = (e, member) => {
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setSelectedContextMember(member);
    setContextMenuAnchor(e.currentTarget);
  };

  const handleListItemClick = (memberId) => {
    onSelectMember(memberId);
  };

  return (
    <Box>
      <Paper sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <List sx={{ py: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              selected={selectedMember === ''}
              onClick={() => handleListItemClick('')}
              sx={{
                py: 1,
                px: 2,
                backgroundColor: selectedMember === '' ? 'rgba(10, 88, 191, 0.12)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(10, 88, 191, 0.12)',
                },
              }}
            >
              <Typography variant="body2">All Members</Typography>
            </ListItemButton>
          </ListItem>
          {members.map((member) => (
            <ListItem
              key={member.id}
              disablePadding
              onContextMenu={(e) => handleContextMenu(e, member)}
            >
              <ListItemButton
                selected={selectedMember === member.id}
                onClick={() => handleListItemClick(member.id)}
                sx={{
                  py: 1,
                  px: 2,
                  backgroundColor: selectedMember === member.id ? 'rgba(10, 88, 191, 0.12)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(10, 88, 191, 0.12)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {member.name}
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

      {/* Team Member Context Menu */}
      <TeamMemberContextMenu
        open={Boolean(contextMenuAnchor)}
        anchorEl={contextMenuAnchor}
        onClose={() => {
          setContextMenuAnchor(null);
          setSelectedContextMember(null);
        }}
        member={selectedContextMember}
        onMemberUpdated={onMemberUpdated}
        onMemberDeleted={onMemberDeleted}
      />
    </Box>
  );
};

export default TeamMemberList;
