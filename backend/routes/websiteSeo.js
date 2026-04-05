const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all website SEO KPIs with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;
        let query = `
            SELECT ws.*, ws.team_member_ids, ws.gmb_updates, ws.gmb_changes_count, ws.gmb_changes_details, c.name as client_name, tm.name as team_member_name
            FROM website_seo_kpis ws
            LEFT JOIN clients c ON ws.client_id = c.id
            LEFT JOIN team_members tm ON ws.team_member_id = tm.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ` AND ws.date >= $${params.length + 1}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND ws.date <= $${params.length + 1}`;
            params.push(endDate);
        }

        if (clientId) {
            query += ` AND ws.client_id = $${params.length + 1}`;
            params.push(clientId);
        }

        query += ' ORDER BY ws.date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching website SEO KPIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new website SEO KPI
router.post('/', authorize(['admin', 'editor']), async (req, res) => {
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        changes_asked,
        changes_asked_details,
        changes_asked_statuses,
        blogs_posted,
        ranking_issues,
        ranking_issues_description,
        reports_sent,
        backlinks,
        gmb_updates,
        gmb_changes_count,
        gmb_changes_details,
        domain_authority,
        page_authority,
        keyword_pass,
        keyword_names,
        keyword_positions,
        site_health
    } = req.body;

    const primaryTeamMemberId = (Array.isArray(team_member_ids) && team_member_ids.length > 0)
        ? team_member_ids[0]
        : team_member_id;

    try {
        const result = await pool.query(
            `INSERT INTO website_seo_kpis 
                (client_id, team_member_id, team_member_ids, date, changes_asked, changes_asked_details, changes_asked_statuses, blogs_posted,
                 ranking_issues, ranking_issues_description, reports_sent, backlinks, gmb_updates, gmb_changes_count, gmb_changes_details, domain_authority, page_authority,
                 keyword_pass, keyword_names, keyword_positions, site_health)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
                [
                    client_id, primaryTeamMemberId, team_member_ids || [], date, changes_asked, changes_asked_details || [], changes_asked_statuses || [], blogs_posted,
                    ranking_issues, ranking_issues_description, reports_sent, backlinks, gmb_updates || 0, gmb_changes_count || 0, gmb_changes_details || [], domain_authority, page_authority,
                    keyword_pass, keyword_names || [], keyword_positions || [], site_health
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
            'website_seo',
            kpi.id,
            `${clientName} - SEO`,
            'WebsiteSEOTab',
            `${userName} added website SEO data for ${clientName} on ${date}`
        );
        
        res.status(201).json(kpi);
    } catch (error) {
        console.error('Error creating website SEO KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update website SEO KPI
router.put('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        changes_asked,
        changes_asked_details,
        changes_asked_statuses,
        blogs_posted,
        ranking_issues,
        ranking_issues_description,
        reports_sent,
        backlinks,
        gmb_updates,
        gmb_changes_count,
        gmb_changes_details,
        domain_authority,
        page_authority,
        keyword_pass,
        keyword_names,
        keyword_positions,
        site_health
    } = req.body;

    const primaryTeamMemberId = (Array.isArray(team_member_ids) && team_member_ids.length > 0)
        ? team_member_ids[0]
        : team_member_id;

    try {
        const result = await pool.query(
            `UPDATE website_seo_kpis 
            SET client_id = $1, team_member_id = $2, team_member_ids = $3, date = $4, changes_asked = $5, changes_asked_details = $6, changes_asked_statuses = $7,
                blogs_posted = $8, ranking_issues = $9, ranking_issues_description = $10, reports_sent = $11,
                backlinks = $12, gmb_updates = $13, gmb_changes_count = $14, gmb_changes_details = $15, domain_authority = $16, page_authority = $17,
                keyword_pass = $18, keyword_names = $19, keyword_positions = $20, site_health = $21,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $22 RETURNING *`,
            [
                client_id, primaryTeamMemberId, team_member_ids || [], date, changes_asked, changes_asked_details || [], changes_asked_statuses || [], blogs_posted,
                ranking_issues, ranking_issues_description, reports_sent, backlinks, gmb_updates || 0, gmb_changes_count || 0, gmb_changes_details || [], domain_authority, page_authority,
                keyword_pass, keyword_names || [], keyword_positions || [], site_health, id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Website SEO KPI not found' });
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
            'website_seo',
            kpi.id,
            `${clientName} - SEO`,
            'WebsiteSEOTab',
            `${userName} edited website SEO data for ${clientName} on ${date}`
        );
        
        res.json(kpi);
    } catch (error) {
        console.error('Error updating website SEO KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete website SEO KPI
router.delete('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM website_seo_kpis WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Website SEO KPI not found' });
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
                'website_seo',
                kpi.id,
                `${clientName} - SEO`,
                'WebsiteSEOTab',
                `${userName} deleted website SEO data for ${clientName} on ${kpi.date}`
            );
        } catch (e) {
            console.error('Error logging website SEO deletion:', e.message);
        }

        res.json({ message: 'Website SEO KPI deleted successfully' });
    } catch (error) {
        console.error('Error deleting website SEO KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;