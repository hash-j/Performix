const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all clients for the current company
router.get('/', async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const result = await pool.query('SELECT * FROM clients WHERE company_id = $1 ORDER BY name', [companyId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new client
router.post('/', authorize(['superadmin', 'admin', 'editor']), async (req, res) => {
    const { name } = req.body;
    const companyId = req.user.company_id;
    try {
        const result = await pool.query(
            'INSERT INTO clients (company_id, name) VALUES ($1, $2) RETURNING *',
            [companyId, name]
        );
        const client = result.rows[0];
        
        // Log the activity
        const userId = req.user.id;
        const userName = req.user.full_name;
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
    const companyId = req.user.company_id;
    try {
        const result = await pool.query('SELECT * FROM clients WHERE id = $1 AND company_id = $2', [id, companyId]);
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
router.put('/:id', authorize(['superadmin', 'admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const companyId = req.user.company_id;
    try {
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        const result = await pool.query(
            'UPDATE clients SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3 RETURNING *',
            [name.trim(), id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const client = result.rows[0];
        
        // Log the activity
        const userId = req.user.id;
        const userName = req.user.full_name;
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
router.delete('/:id', authorize(['superadmin', 'admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const connection = await pool.connect();
    try {
        await connection.query('BEGIN');
        
        // Check if client exists and belongs to company
        const clientResult = await connection.query('SELECT name FROM clients WHERE id = $1 AND company_id = $2', [id, companyId]);
        if (clientResult.rows.length === 0) {
            await connection.query('ROLLBACK');
            connection.release();
            return res.status(404).json({ error: 'Client not found' });
        }
        const clientName = clientResult.rows[0].name;
        
        // Delete the client (cascading deletes will handle the KPI tables due to ON DELETE CASCADE)
        const result = await connection.query(
            'DELETE FROM clients WHERE id = $1 AND company_id = $2 RETURNING *',
            [id, companyId]
        );

        await connection.query('COMMIT');
        connection.release();
        
        // Log the deletion activity
        try {
            const userId = req.user.id;
            const userName = req.user.full_name;
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