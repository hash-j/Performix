const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all email marketing KPIs with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;
        let query = `
            SELECT em.*, em.team_member_ids, c.name as client_name, tm.name as team_member_name
            FROM email_marketing_kpis em
            LEFT JOIN clients c ON em.client_id = c.id
            LEFT JOIN team_members tm ON em.team_member_id = tm.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ` AND em.date >= $${params.length + 1}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND em.date <= $${params.length + 1}`;
            params.push(endDate);
        }

        if (clientId) {
            query += ` AND em.client_id = $${params.length + 1}`;
            params.push(clientId);
        }

        query += ' ORDER BY em.date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching email marketing KPIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new email marketing KPI
router.post('/', authorize(['admin', 'editor']), async (req, res) => {
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        template_quality,
        emails_sent,
        opening_ratio
    } = req.body;

    const primaryTeamMemberId = (Array.isArray(team_member_ids) && team_member_ids.length > 0)
        ? team_member_ids[0]
        : team_member_id;

    try {
        const result = await pool.query(
            `INSERT INTO email_marketing_kpis 
            (client_id, team_member_id, team_member_ids, date, template_quality, emails_sent, opening_ratio)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [client_id, primaryTeamMemberId, team_member_ids || [], date, template_quality, emails_sent, opening_ratio]
        );
        
        const kpi = result.rows[0];
        
        // Get client name for logging
        const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [client_id]);
        const clientName = clientResult.rows[0]?.name || 'Unknown Client';
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'data_added',
            'email_marketing',
            kpi.id,
            `${clientName} - Email`,
            'EmailMarketingTab',
            `${userName} added email marketing data for ${clientName} on ${date}`
        );
        
        res.status(201).json(kpi);
    } catch (error) {
        console.error('Error creating email marketing KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update email marketing KPI
router.put('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        template_quality,
        emails_sent,
        opening_ratio
    } = req.body;

    const primaryTeamMemberId = (Array.isArray(team_member_ids) && team_member_ids.length > 0)
        ? team_member_ids[0]
        : team_member_id;

    try {
        const result = await pool.query(
            `UPDATE email_marketing_kpis 
            SET client_id = $1, team_member_id = $2, team_member_ids = $3, date = $4, 
                template_quality = $5, emails_sent = $6, opening_ratio = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 RETURNING *`,
            [client_id, primaryTeamMemberId, team_member_ids || [], date, template_quality, emails_sent, opening_ratio, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Email marketing KPI not found' });
        }
        
        const kpi = result.rows[0];
        
        // Get client name for logging
        const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [client_id]);
        const clientName = clientResult.rows[0]?.name || 'Unknown Client';
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'data_edited',
            'email_marketing',
            kpi.id,
            `${clientName} - Email`,
            'EmailMarketingTab',
            `${userName} edited email marketing data for ${clientName} on ${date}`
        );
        
        res.json(kpi);
    } catch (error) {
        console.error('Error updating email marketing KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete email marketing KPI
router.delete('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM email_marketing_kpis WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Email marketing KPI not found' });
        }

        try {
            const kpi = result.rows[0];
            const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [kpi.client_id]);
            const clientName = clientResult.rows[0]?.name || 'Unknown Client';
            const userId = req.user?.id || null;
            const userName = req.user?.full_name || 'Unknown User';
            await logActivity(
                userId,
                'data_deleted',
                'email_marketing',
                kpi.id,
                `${clientName} - Email`,
                'EmailMarketingTab',
                `${userName} deleted email marketing data for ${clientName} on ${kpi.date}`
            );
        } catch (e) {
            console.error('Error logging email marketing deletion:', e.message);
        }

        res.json({ message: 'Email marketing KPI deleted successfully' });
    } catch (error) {
        console.error('Error deleting email marketing KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;