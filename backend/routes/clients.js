const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all clients
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new client
router.post('/', authorize(['admin', 'editor']), async (req, res) => {
    const { name } = req.body;
    try {
        // Debug: Log user info
        console.log('[Client Creation] User info:', {
            userId: req.user?.id,
            userName: req.user?.full_name,
            userRole: req.user?.role,
            hasUser: !!req.user
        });
        
        const result = await pool.query(
            'INSERT INTO clients (name) VALUES ($1) RETURNING *',
            [name]
        );
        const client = result.rows[0];
        console.log('[Client Creation] Client created:', client.id, client.name);
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'client_added',
            'client',
            client.id,
            client.name,
            null,
            `${userName} added new client: ${client.name}`
        );
        
        res.status(201).json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get client by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update client
router.put('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        const result = await pool.query(
            'UPDATE clients SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [name.trim(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const client = result.rows[0];
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'client_edited',
            'client',
            client.id,
            client.name,
            null,
            `${userName} edited client: ${client.name}`
        );

        res.json(client);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete client and all related data
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.connect();
    try {
        await connection.query('BEGIN');
        
        // Get client name for logging
        const clientResult = await connection.query('SELECT name FROM clients WHERE id = $1', [id]);
        const clientName = clientResult.rows[0]?.name || 'Unknown Client';
        
        // Delete all related KPI data first
        await connection.query('DELETE FROM social_media_kpis WHERE client_id = $1', [id]);
        await connection.query('DELETE FROM website_seo_kpis WHERE client_id = $1', [id]);
        await connection.query('DELETE FROM ads_kpis WHERE client_id = $1', [id]);
        await connection.query('DELETE FROM email_marketing_kpis WHERE client_id = $1', [id]);
        await connection.query('DELETE FROM client_responses WHERE client_id = $1', [id]);
        
        // Delete the client
        const result = await connection.query(
            'DELETE FROM clients WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            await connection.query('ROLLBACK');
            connection.release();
            return res.status(404).json({ error: 'Client not found' });
        }

        await connection.query('COMMIT');
        connection.release();
        
        // Log the deletion activity
        try {
            const userId = req.user?.id || null;
            const userName = req.user?.full_name || 'Unknown User';
            await logActivity(
                userId,
                'client_deleted',
                'client',
                result.rows[0].id,
                clientName,
                null,
                `${userName} deleted client: ${clientName}`
            );
        } catch (e) {
            console.error('Error logging client deletion:', e.message);
        }

        res.json({ message: 'Client and all related data deleted successfully', deletedClient: result.rows[0] });
    } catch (error) {
        try {
            await connection.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
        }
        connection.release();
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client. Database error occurred.' });
    }
});

module.exports = router;