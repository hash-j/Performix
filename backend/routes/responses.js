const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all client responses with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;
        let query = `
            SELECT cr.*, cr.team_member_ids, c.name as client_name, tm.name as team_member_name
            FROM client_responses cr
            LEFT JOIN clients c ON cr.client_id = c.id
            LEFT JOIN team_members tm ON cr.team_member_id = tm.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ` AND cr.date >= $${params.length + 1}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND cr.date <= $${params.length + 1}`;
            params.push(endDate);
        }

        if (clientId) {
            query += ` AND cr.client_id = $${params.length + 1}`;
            params.push(clientId);
        }

        query += ' ORDER BY cr.date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching client responses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new client response
router.post('/', authorize(['admin', 'editor']), async (req, res) => {
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        review_rating,
        review_comment,
        miscellaneous_work
    } = req.body;

    const primaryTeamMemberId = (Array.isArray(team_member_ids) && team_member_ids.length > 0)
        ? team_member_ids[0]
        : team_member_id;

    try {
        const result = await pool.query(
            `INSERT INTO client_responses 
            (client_id, team_member_id, team_member_ids, date, review_rating, review_comment, miscellaneous_work)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [client_id, primaryTeamMemberId, team_member_ids || [], date, review_rating, review_comment, miscellaneous_work]
        );
        
        const response = result.rows[0];
        
        // Get client name for logging
        const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [client_id]);
        const clientName = clientResult.rows[0]?.name || 'Unknown Client';
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'data_added',
            'client_responses',
            response.id,
            `${clientName} - Response`,
            'ClientResponsesTab',
            `${userName} added client response for ${clientName} on ${date}`
        );
        
        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating client response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update client response
router.put('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        review_rating,
        review_comment,
        miscellaneous_work
    } = req.body;

    const primaryTeamMemberId = (Array.isArray(team_member_ids) && team_member_ids.length > 0)
        ? team_member_ids[0]
        : team_member_id;

    try {
        const result = await pool.query(
            `UPDATE client_responses 
            SET client_id = $1, team_member_id = $2, team_member_ids = $3, date = $4, 
                review_rating = $5, review_comment = $6, miscellaneous_work = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 RETURNING *`,
            [client_id, primaryTeamMemberId, team_member_ids || [], date, review_rating, review_comment, miscellaneous_work, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client response not found' });
        }
        
        const response = result.rows[0];
        
        // Get client name for logging
        const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [client_id]);
        const clientName = clientResult.rows[0]?.name || 'Unknown Client';
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'data_edited',
            'client_responses',
            response.id,
            `${clientName} - Response`,
            'ClientResponsesTab',
            `${userName} edited client response for ${clientName} on ${date}`
        );
        
        res.json(response);
    } catch (error) {
        console.error('Error updating client response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete client response
router.delete('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM client_responses WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client response not found' });
        }

        try {
            const response = result.rows[0];
            const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [response.client_id]);
            const clientName = clientResult.rows[0]?.name || 'Unknown Client';
            const userId = req.user?.id || null;
            const userName = req.user?.full_name || 'Unknown User';
            await logActivity(
                userId,
                'data_deleted',
                'client_responses',
                response.id,
                `${clientName} - Response`,
                'ClientResponsesTab',
                `${userName} deleted client response for ${clientName} on ${response.date}`
            );
        } catch (e) {
            console.error('Error logging client response deletion:', e.message);
        }

        res.json({ message: 'Client response deleted successfully' });
    } catch (error) {
        console.error('Error deleting client response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;