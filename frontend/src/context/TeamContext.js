import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const TeamContext = createContext();

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider = ({ children }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/team');
      setTeamMembers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch team members');
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async (memberData) => {
    try {
      const response = await api.post('/team', memberData);
      setTeamMembers(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error adding team member:', err);
      throw err;
    }
  };

  const updateTeamMember = async (id, memberData) => {
    try {
      const response = await api.put(`/team/${id}`, memberData);
      setTeamMembers(prev => prev.map(member => 
        member.id === id ? response.data : member
      ));
      return response.data;
    } catch (err) {
      console.error('Error updating team member:', err);
      throw err;
    }
  };

  const deleteTeamMember = async (id) => {
    try {
      await api.delete(`/team/${id}`);
      setTeamMembers(prev => prev.filter(member => member.id !== id));
    } catch (err) {
      console.error('Error deleting team member:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const value = {
    teamMembers,
    loading,
    error,
    fetchTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
};