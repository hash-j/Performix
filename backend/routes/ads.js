const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all ads KPIs with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;
        let query = `
            SELECT a.*, a.team_member_ids, c.name as client_name, tm.name as team_member_name
            FROM ads_kpis a
            LEFT JOIN clients c ON a.client_id = c.id
            LEFT JOIN team_members tm ON a.team_member_id = tm.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ` AND a.date >= $${params.length + 1}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND a.date <= $${params.length + 1}`;
            params.push(endDate);
        }

        if (clientId) {
            query += ` AND a.client_id = $${params.length + 1}`;
            params.push(clientId);
        }

        query += ' ORDER BY a.date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching ads KPIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new ads KPI
router.post('/', authorize(['admin', 'editor']), async (req, res) => {
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        platform,
        cost_per_lead,
        quality_of_ads,
        lead_quality,
        closing_ratio,
        quantity_leads,
        keyword_refinement,
        cost_per_click,
        conversions,
        closing,
        tracking
    } = req.body;

    const primaryTeamMemberId = Array.isArray(team_member_ids) && team_member_ids.length > 0 ? team_member_ids[0] : team_member_id;

    try {
        const result = await pool.query(
            `INSERT INTO ads_kpis 
            (client_id, team_member_id, team_member_ids, date, platform, cost_per_lead, quality_of_ads,
             lead_quality, closing_ratio, quantity_leads, keyword_refinement,
             cost_per_click, conversions, closing, tracking)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
            [
                client_id, primaryTeamMemberId, team_member_ids || [], date, platform, cost_per_lead, quality_of_ads,
                lead_quality, closing_ratio, quantity_leads, keyword_refinement,
                cost_per_click, conversions, closing, tracking
            ]
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
            'ads',
            kpi.id,
            `${clientName} - ${platform}`,
            'AdsTab',
            `${userName} added ads data for ${clientName} on ${date}`
        );
        
        res.status(201).json(kpi);
    } catch (error) {
        console.error('Error creating ads KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update ads KPI
router.put('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        platform,
        cost_per_lead,
        quality_of_ads,
        lead_quality,
        closing_ratio,
        quantity_leads,
        keyword_refinement,
        cost_per_click,
        conversions,
        closing,
        tracking
    } = req.body;

    const primaryTeamMemberId = Array.isArray(team_member_ids) && team_member_ids.length > 0 ? team_member_ids[0] : team_member_id;

    try {
        const result = await pool.query(
            `UPDATE ads_kpis 
            SET client_id = $1, team_member_id = $2, team_member_ids = $3, date = $4, platform = $5,
                cost_per_lead = $6, quality_of_ads = $7, lead_quality = $8,
                closing_ratio = $9, quantity_leads = $10, keyword_refinement = $11,
                cost_per_click = $12, conversions = $13, closing = $14, tracking = $15,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $16 RETURNING *`,
            [
                client_id, primaryTeamMemberId, team_member_ids || [], date, platform, cost_per_lead, quality_of_ads,
                lead_quality, closing_ratio, quantity_leads, keyword_refinement,
                cost_per_click, conversions, closing, tracking, id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ads KPI not found' });
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
            'ads',
            kpi.id,
            `${clientName} - ${platform}`,
            'AdsTab',
            `${userName} edited ads data for ${clientName} on ${date}`
        );
        
        res.json(kpi);
    } catch (error) {
        console.error('Error updating ads KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete ads KPI
router.delete('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM ads_kpis WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ads KPI not found' });
        }

        // Log deletion with client info if available
        try {
            const kpi = result.rows[0];
            const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [kpi.client_id]);
            const clientName = clientResult.rows[0]?.name || 'Unknown Client';
            const userId = req.user?.id || null;
            const userName = req.user?.full_name || 'Unknown User';
            await logActivity(
                userId,
                'data_deleted',
                'ads',
                kpi.id,
                `${clientName} - ${kpi.platform || ''}`,
                'AdsTab',
                `${userName} deleted ads data for ${clientName} on ${kpi.date}`
            );
        } catch (e) {
            console.error('Error logging ads deletion:', e.message);
        }

        res.json({ message: 'Ads KPI deleted successfully' });
    } catch (error) {
        console.error('Error deleting ads KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;