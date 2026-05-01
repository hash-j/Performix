const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all social media KPIs with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;
        let query = `
            SELECT sm.*, sm.team_member_ids, c.name as client_name, tm.name as team_member_name
            FROM social_media_kpis sm
            LEFT JOIN clients c ON sm.client_id = c.id
            LEFT JOIN team_members tm ON sm.team_member_id = tm.id
            WHERE sm.company_id = $1
        `;
        const companyId = req.user.company_id;
        const params = [companyId];

        if (startDate) {
            query += ` AND sm.date >= $${params.length + 1}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND sm.date <= $${params.length + 1}`;
            params.push(endDate);
        }

        if (clientId) {
            query += ` AND sm.client_id = $${params.length + 1}`;
            params.push(clientId);
        }

        query += ' ORDER BY sm.date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching social media KPIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new social media KPI
router.post('/', authorize(['admin', 'editor']), async (req, res) => {
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        platform,
        quality_score,
        quantity,
        instagram_stories,
        instagram_stories_quality,
        instagram_posts,
        instagram_posts_quality,
        instagram_reels,
        instagram_reels_quality,
        facebook_stories,
        facebook_stories_quality,
        facebook_posts,
        facebook_posts_quality,
        facebook_reels,
        facebook_reels_quality,
        tiktok_stories,
        tiktok_stories_quality,
        tiktok_posts,
        tiktok_posts_quality,
        tiktok_reels,
        tiktok_reels_quality
    } = req.body;

    // determine primary team_member_id for backward compatibility
    const primaryTeamMemberId = Array.isArray(team_member_ids) && team_member_ids.length > 0 ? team_member_ids[0] : team_member_id;

    // Calculate total quantity and quality score based on platform
    let finalQuantity = quantity || 0;
    let finalQualityScore = quality_score || 5;

    // For platforms with detailed breakdown (Instagram, Facebook, TikTok), calculate from details
    if (['Instagram', 'Facebook', 'TikTok'].includes(platform)) {
        // Calculate total quantity (sum of all platform specific quantities)
        finalQuantity = (instagram_stories || 0) + (instagram_posts || 0) + (instagram_reels || 0) +
                        (facebook_stories || 0) + (facebook_posts || 0) + (facebook_reels || 0) +
                        (tiktok_stories || 0) + (tiktok_posts || 0) + (tiktok_reels || 0);

        // Calculate combined quality score (average of all platform specific quality scores)
        const allQualityScores = [
            instagram_stories_quality || 5, instagram_posts_quality || 5, instagram_reels_quality || 5,
            facebook_stories_quality || 5, facebook_posts_quality || 5, facebook_reels_quality || 5,
            tiktok_stories_quality || 5, tiktok_posts_quality || 5, tiktok_reels_quality || 5
        ];
        finalQualityScore = Math.round(allQualityScores.reduce((a, b) => a + b, 0) / allQualityScores.length);
    }
    // For Reddit and YouTube, use the manual values provided by user

    try {
        const result = await pool.query(
            `INSERT INTO social_media_kpis 
            (company_id, client_id, team_member_id, team_member_ids, date, platform, quality_score, quantity,
             instagram_stories, instagram_stories_quality, instagram_posts, instagram_posts_quality, instagram_reels, instagram_reels_quality,
             facebook_stories, facebook_stories_quality, facebook_posts, facebook_posts_quality, facebook_reels, facebook_reels_quality,
             tiktok_stories, tiktok_stories_quality, tiktok_posts, tiktok_posts_quality, tiktok_reels, tiktok_reels_quality)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26) RETURNING *`,
            [req.user.company_id, client_id, primaryTeamMemberId, team_member_ids || [], date, platform, finalQualityScore, finalQuantity,
             instagram_stories || 0, instagram_stories_quality || 5, instagram_posts || 0, instagram_posts_quality || 5, instagram_reels || 0, instagram_reels_quality || 5,
             facebook_stories || 0, facebook_stories_quality || 5, facebook_posts || 0, facebook_posts_quality || 5, facebook_reels || 0, facebook_reels_quality || 5,
             tiktok_stories || 0, tiktok_stories_quality || 5, tiktok_posts || 0, tiktok_posts_quality || 5, tiktok_reels || 0, tiktok_reels_quality || 5]
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
            'social_media',
            kpi.id,
            `${clientName} - ${platform}`,
            'SocialMediaTab',
            `${userName} added social media data for ${clientName} on ${date}`
        );
        
        res.status(201).json(kpi);
    } catch (error) {
        console.error('Error creating social media KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update social media KPI
router.put('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const {
        client_id,
        team_member_id,
        team_member_ids,
        date,
        platform,
        quality_score,
        quantity,
        instagram_stories,
        instagram_stories_quality,
        instagram_posts,
        instagram_posts_quality,
        instagram_reels,
        instagram_reels_quality,
        facebook_stories,
        facebook_stories_quality,
        facebook_posts,
        facebook_posts_quality,
        facebook_reels,
        facebook_reels_quality,
        tiktok_stories,
        tiktok_stories_quality,
        tiktok_posts,
        tiktok_posts_quality,
        tiktok_reels,
        tiktok_reels_quality
    } = req.body;

    const primaryTeamMemberId = Array.isArray(team_member_ids) && team_member_ids.length > 0 ? team_member_ids[0] : team_member_id;

    // Calculate total quantity and quality score based on platform
    let finalQuantity = quantity || 0;
    let finalQualityScore = quality_score || 5;

    // For platforms with detailed breakdown (Instagram, Facebook, TikTok), calculate from details
    if (['Instagram', 'Facebook', 'TikTok'].includes(platform)) {
        // Calculate total quantity (sum of all platform specific quantities)
        finalQuantity = (instagram_stories || 0) + (instagram_posts || 0) + (instagram_reels || 0) +
                        (facebook_stories || 0) + (facebook_posts || 0) + (facebook_reels || 0) +
                        (tiktok_stories || 0) + (tiktok_posts || 0) + (tiktok_reels || 0);

        // Calculate combined quality score (average of all platform specific quality scores)
        const allQualityScores = [
            instagram_stories_quality || 5, instagram_posts_quality || 5, instagram_reels_quality || 5,
            facebook_stories_quality || 5, facebook_posts_quality || 5, facebook_reels_quality || 5,
            tiktok_stories_quality || 5, tiktok_posts_quality || 5, tiktok_reels_quality || 5
        ];
        finalQualityScore = Math.round(allQualityScores.reduce((a, b) => a + b, 0) / allQualityScores.length);
    }
    // For Reddit and YouTube, use the manual values provided by user

    try {
        const result = await pool.query(
            `UPDATE social_media_kpis 
            SET client_id = $1, team_member_id = $2, team_member_ids = $3, date = $4, 
                platform = $5, quality_score = $6, quantity = $7,
                instagram_stories = $8, instagram_stories_quality = $9, instagram_posts = $10, instagram_posts_quality = $11, instagram_reels = $12, instagram_reels_quality = $13,
                facebook_stories = $14, facebook_stories_quality = $15, facebook_posts = $16, facebook_posts_quality = $17, facebook_reels = $18, facebook_reels_quality = $19,
                tiktok_stories = $20, tiktok_stories_quality = $21, tiktok_posts = $22, tiktok_posts_quality = $23, tiktok_reels = $24, tiktok_reels_quality = $25,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $26 AND company_id = $27 RETURNING *`,
            [client_id, primaryTeamMemberId, team_member_ids || [], date, platform, finalQualityScore, finalQuantity,
             instagram_stories || 0, instagram_stories_quality || 5, instagram_posts || 0, instagram_posts_quality || 5, instagram_reels || 0, instagram_reels_quality || 5,
             facebook_stories || 0, facebook_stories_quality || 5, facebook_posts || 0, facebook_posts_quality || 5, facebook_reels || 0, facebook_reels_quality || 5,
             tiktok_stories || 0, tiktok_stories_quality || 5, tiktok_posts || 0, tiktok_posts_quality || 5, tiktok_reels || 0, tiktok_reels_quality || 5,
             id, req.user.company_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Social media KPI not found' });
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
            'social_media',
            kpi.id,
            `${clientName} - ${platform}`,
            'SocialMediaTab',
            `${userName} edited social media data for ${clientName} on ${date}`
        );
        
        res.json(kpi);
    } catch (error) {
        console.error('Error updating social media KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete social media KPI
router.delete('/:id', authorize(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM social_media_kpis WHERE id = $1 AND company_id = $2 RETURNING *',
            [id, req.user.company_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Social media KPI not found' });
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
                'social_media',
                kpi.id,
                `${clientName} - ${kpi.platform || ''}`,
                'SocialMediaTab',
                `${userName} deleted social media data for ${clientName} on ${kpi.date}`
            );
        } catch (e) {
            console.error('Error logging social media deletion:', e.message);
        }

        res.json({ message: 'Social media KPI deleted successfully' });
    } catch (error) {
        console.error('Error deleting social media KPI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;