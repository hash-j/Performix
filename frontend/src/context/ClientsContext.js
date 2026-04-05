import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const ClientsContext = createContext();

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};

export const ClientsProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData) => {
    try {
      const response = await api.post('/clients', clientData);
      setClients(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error adding client:', err);
      throw err;
    }
  };

  const updateClient = async (id, clientData) => {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      setClients(prev => prev.map(client => 
        client.id === id ? response.data : client
      ));
      return response.data;
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    }
  };

  const deleteClient = async (id) => {
    try {
      await api.delete(`/clients/${id}`);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      console.error('Error deleting client:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const value = {
    clients,
    loading,
    error,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
  };

  return (
    <ClientsContext.Provider value={value}>
      {children}
    </ClientsContext.Provider>
  );
};