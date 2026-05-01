const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all team members for the current company
router.get('/', async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const result = await pool.query('SELECT * FROM team_members WHERE company_id = $1 ORDER BY name', [companyId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new team member
router.post('/', authorize(['superadmin', 'admin', 'editor']), async (req, res) => {
    const { name, email } = req.body;
    const companyId = req.user.company_id;
    try {
        const result = await pool.query(
            'INSERT INTO team_members (company_id, name, email) VALUES ($1, $2, $3) RETURNING *',
            [companyId, name, email]
        );
        const member = result.rows[0];
        
        // Log the activity
        const userId = req.user.id;
        const userName = req.user.full_name;
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
router.put('/:id', authorize(['superadmin', 'admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const companyId = req.user.company_id;
    try {
        const result = await pool.query(
            'UPDATE team_members SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND company_id = $4 RETURNING *',
            [name, email, id, companyId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team member not found' });
        }
        
        const member = result.rows[0];
        
        // Log the activity
        const userId = req.user.id;
        const userName = req.user.full_name;
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
router.delete('/:id', authorize(['superadmin', 'admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const connection = await pool.connect();
    try {
        await connection.query('BEGIN');
        
        // Get member name for logging and ensure they belong to this company
        const memberResult = await connection.query('SELECT name FROM team_members WHERE id = $1 AND company_id = $2', [id, companyId]);
        if (memberResult.rows.length === 0) {
            await connection.query('ROLLBACK');
            connection.release();
            return res.status(404).json({ error: 'Team member not found' });
        }
        const memberName = memberResult.rows[0].name;
        
        // Due to schema CASCADE constraints, deleting the team_member handles team_kpis deletion,
        // and sets team_member_id to NULL in social_media_kpis, website_seo_kpis, ads_kpis, email_marketing_kpis, client_responses.
        // We only need to delete the member itself.
        const result = await connection.query(
            'DELETE FROM team_members WHERE id = $1 AND company_id = $2 RETURNING *',
            [id, companyId]
        );
        
        await connection.query('COMMIT');
        connection.release();
        
        // Log the deletion
        try {
            const userId = req.user.id;
            const userName = req.user.full_name;
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

        res.json({ message: 'Team member deleted successfully', deletedMember: result.rows[0] });
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