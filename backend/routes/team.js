const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all team members
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM team_members ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new team member
router.post('/', authorize(['admin', 'editor']), async (req, res) => {
    const { name, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO team_members (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        const member = result.rows[0];
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'team_member_added',
            'team_member',
            member.id,
            member.name,
            null,
            `${userName} added new team member: ${member.name}`
        );
        
        res.status(201).json(member);
    } catch (error) {
        console.error('Error creating team member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update team member
router.put('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    try {
        const result = await pool.query(
            'UPDATE team_members SET name = $1, email = $2 WHERE id = $3 RETURNING *',
            [name, email, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team member not found' });
        }
        
        const member = result.rows[0];
        
        // Log the activity
        const userId = req.user?.id || null;
        const userName = req.user?.full_name || 'Unknown User';
        await logActivity(
            userId,
            'team_member_edited',
            'team_member',
            member.id,
            member.name,
            null,
            `${userName} edited team member: ${member.name}`
        );
        
        res.json(member);
    } catch (error) {
        console.error('Error updating team member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete team member and all related data
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.connect();
    try {
        await connection.query('BEGIN');
        
        // Get member name for logging
        const memberResult = await connection.query('SELECT name FROM team_members WHERE id = $1', [id]);
        const memberName = memberResult.rows[0]?.name || 'Unknown Member';
        
        // Delete all related KPI data first (set team_member_id to NULL or delete)
        await connection.query('DELETE FROM team_kpis WHERE team_member_id = $1', [id]);
        await connection.query('UPDATE social_media_kpis SET team_member_id = NULL WHERE team_member_id = $1', [id]);
        await connection.query('UPDATE website_seo_kpis SET team_member_id = NULL WHERE team_member_id = $1', [id]);
        await connection.query('UPDATE ads_kpis SET team_member_id = NULL WHERE team_member_id = $1', [id]);
        await connection.query('UPDATE email_marketing_kpis SET team_member_id = NULL WHERE team_member_id = $1', [id]);
        await connection.query('UPDATE client_responses SET team_member_id = NULL WHERE team_member_id = $1', [id]);
        
        // Delete the team member
        const result = await connection.query(
            'DELETE FROM team_members WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            await connection.query('ROLLBACK');
            connection.release();
            return res.status(404).json({ error: 'Team member not found' });
        }
        
        await connection.query('COMMIT');
        connection.release();
        // Log the deletion
        try {
            const userId = req.user?.id || null;
            const userName = req.user?.full_name || 'Unknown User';
            await logActivity(
                userId,
                'team_member_deleted',
                'team_member',
                result.rows[0].id,
                memberName,
                null,
                `${userName} deleted team member: ${memberName}`
            );
        } catch (e) {
            console.error('Error logging team member deletion:', e.message);
        }

        res.json({ message: 'Team member and all related data deleted successfully', deletedMember: result.rows[0] });
    } catch (error) {
        try {
            await connection.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
        }
        connection.release();
        console.error('Error deleting team member:', error);
        res.status(500).json({ error: 'Failed to delete team member. Database error occurred.' });
    }
});

module.exports = router;