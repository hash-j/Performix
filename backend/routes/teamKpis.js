const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all team KPIs with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, teamMemberId } = req.query;
        let query = `
            SELECT tk.*, tm.name as team_member_name, tm.email
            FROM team_kpis tk
            LEFT JOIN team_members tm ON tk.team_member_id = tm.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ` AND tk.date >= $${params.length + 1}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND tk.date <= $${params.length + 1}`;
            params.push(endDate);
        }

        if (teamMemberId) {
            query += ` AND tk.team_member_id = $${params.length + 1}`;
            params.push(teamMemberId);
        }

        query += ' ORDER BY tk.date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching team KPIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new team KPI
router.post('/', authorize(['admin', 'editor']), async (req, res) => {
    const {
        team_member_id,
        date,
        tasks_assigned,
        tasks_completed,
        quality_score,
        responsibility_score,
        punctuality_score
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO team_kpis 
            (team_member_id, date, tasks_assigned, tasks_completed, 
             quality_score, responsibility_score, punctuality_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                team_member_id, date, tasks_assigned, tasks_completed,
                quality_score, responsibility_score, punctuality_score
            ]
        );
        
        const kpi = result.rows[0];
        
        // Get team member name for logging
        const memberResult = await pool.query('SELECT name FROM team_members WHERE id = $1', [team_member_id]);
        const memberName = memberResult.rows[0]?.name || 'Unknown Member';
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'data_added',
            'team_kpis',
            kpi.id,
            `${memberName} - KPI`,
            'TeamTab',
            `${userName} added team KPI data for ${memberName} on ${date}`
        );
        
        res.status(201).json(kpi);
    } catch (error) {
        console.error('Error creating team KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update team KPI
router.put('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const {
        team_member_id,
        date,
        tasks_assigned,
        tasks_completed,
        quality_score,
        responsibility_score,
        punctuality_score
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE team_kpis 
            SET team_member_id = $1, date = $2, tasks_assigned = $3, 
                tasks_completed = $4, quality_score = $5, responsibility_score = $6,
                punctuality_score = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 RETURNING *`,
            [
                team_member_id, date, tasks_assigned, tasks_completed,
                quality_score, responsibility_score, punctuality_score, id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team KPI not found' });
        }
        
        const kpi = result.rows[0];
        
        // Get team member name for logging
        const memberResult = await pool.query('SELECT name FROM team_members WHERE id = $1', [team_member_id]);
        const memberName = memberResult.rows[0]?.name || 'Unknown Member';
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'data_edited',
            'team_kpis',
            kpi.id,
            `${memberName} - KPI`,
            'TeamTab',
            `${userName} edited team KPI data for ${memberName} on ${date}`
        );
        
        res.json(kpi);
    } catch (error) {
        console.error('Error updating team KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete team KPI
router.delete('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM team_kpis WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team KPI not found' });
        }

        try {
            const kpi = result.rows[0];
            const memberResult = await pool.query('SELECT name FROM team_members WHERE id = $1', [kpi.team_member_id]);
            const memberName = memberResult.rows[0]?.name || 'Unknown Member';
            const userId = req.user?.id || null;
            const userName = req.user?.full_name || 'Unknown User';
            await logActivity(
                userId,
                'data_deleted',
                'team_kpis',
                kpi.id,
                `${memberName} - KPI`,
                'TeamTab',
                `${userName} deleted team KPI data for ${memberName} on ${kpi.date}`
            );
        } catch (e) {
            console.error('Error logging team KPI deletion:', e.message);
        }

        res.json({ message: 'Team KPI deleted successfully' });
    } catch (error) {
        console.error('Error deleting team KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;