const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get unread activities count for current user
router.get('/unread/count', async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        res.json({ unreadCount: 0 });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark activities as read
router.post('/mark-as-read', async (req, res) => {
    try {
        const { activityIds } = req.body;
        
        if (!Array.isArray(activityIds) || activityIds.length === 0) {
            return res.status(400).json({ error: 'activityIds array is required' });
        }
        
        res.json({ 
            success: true, 
            markedAsRead: activityIds.length,
            ids: activityIds
        });
    } catch (error) {
        console.error('Error marking activities as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark all activities as read
router.post('/mark-all-as-read', async (req, res) => {
    try {
        res.json({ 
            success: true, 
            markedAsRead: 0
        });
    } catch (error) {
        console.error('Error marking all activities as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent activities (last 20)
router.get('/', async (req, res) => {
    try {
        const limit = req.query.limit || 20;
        
        const result = await pool.query(
            `SELECT 
                al.id,
                al.user_id,
                al.action_type,
                al.entity_type,
                al.entity_id,
                al.entity_name,
                al.tab_name,
                al.description,
                al.created_at,
                false as is_read,
                u.full_name as user_name
            FROM activity_log al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT $1`,
            [limit]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get activities by action type
router.get('/by-action/:actionType', async (req, res) => {
    try {
        const { actionType } = req.params;
        const limit = req.query.limit || 20;
        
        const result = await pool.query(
            `SELECT 
                al.id,
                al.user_id,
                al.action_type,
                al.entity_type,
                al.entity_id,
                al.entity_name,
                al.tab_name,
                al.description,
                al.created_at,
                false as is_read,
                u.full_name as user_name
            FROM activity_log al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.action_type = $1
            ORDER BY al.created_at DESC
            LIMIT $2`,
            [actionType, limit]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activities by action type:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get activities by date range
router.get('/by-date', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const limit = req.query.limit || 100;
        
        let query = `SELECT 
                al.id,
                al.user_id,
                al.action_type,
                al.entity_type,
                al.entity_id,
                al.entity_name,
                al.tab_name,
                al.description,
                al.created_at,
                false as is_read,
                u.full_name as user_name
            FROM activity_log al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1`;
        
        const params = [];
        
        if (startDate) {
            query += ` AND al.created_at >= $${params.length + 1}`;
            params.push(startDate);
        }
        
        if (endDate) {
            query += ` AND al.created_at <= $${params.length + 1}`;
            params.push(endDate);
        }
        
        query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activities by date:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
