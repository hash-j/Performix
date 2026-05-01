const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const { authorize } = require('../middleware/auth');

// Get all connected integrations for the current company
router.get('/', async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const result = await pool.query('SELECT * FROM integrations WHERE company_id = $1', [companyId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching integrations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Connect an integration (Simulated OAuth)
router.post('/connect', authorize(['superadmin', 'admin']), async (req, res) => {
    const { platform } = req.body;
    const companyId = req.user.company_id;
    
    try {
        // Upsert the connection (if disconnected previously, reconnect it)
        const result = await pool.query(
            `INSERT INTO integrations (company_id, platform, status, last_synced_at)
             VALUES ($1, $2, 'connected', CURRENT_TIMESTAMP)
             ON CONFLICT (company_id, platform) 
             DO UPDATE SET status = 'connected', last_synced_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [companyId, platform]
        );
        
        const integration = result.rows[0];
        
        // Log the activity
        await logActivity(
            req.user.id,
            'integration_connected',
            'integration',
            integration.id,
            platform,
            null,
            `${req.user.full_name} connected ${platform}`
        );
        
        res.status(200).json(integration);
    } catch (error) {
        console.error('Error connecting integration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Disconnect an integration
router.post('/disconnect', authorize(['superadmin', 'admin']), async (req, res) => {
    const { platform } = req.body;
    const companyId = req.user.company_id;
    
    try {
        const result = await pool.query(
            `UPDATE integrations SET status = 'disconnected' 
             WHERE company_id = $1 AND platform = $2 RETURNING *`,
            [companyId, platform]
        );
        
        if (result.rows.length > 0) {
            await logActivity(
                req.user.id,
                'integration_disconnected',
                'integration',
                result.rows[0].id,
                platform,
                null,
                `${req.user.full_name} disconnected ${platform}`
            );
        }
        
        res.status(200).json({ message: 'Disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting integration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Simulated Sync Data engine
router.post('/sync', authorize(['superadmin', 'admin', 'editor']), async (req, res) => {
    const { platform } = req.body;
    const companyId = req.user.company_id;
    
    try {
        console.log("SYNC HIT for platform:", platform, "user:", req.user.id);
        // 1. Verify it is connected
        const integrationRes = await pool.query('SELECT id FROM integrations WHERE company_id = $1 AND platform = $2 AND status = $3', [companyId, platform, 'connected']);
        if (integrationRes.rows.length === 0) {
            console.log("Integration not connected");
            return res.status(400).json({ error: 'Integration is not connected' });
        }
        
        // 2. We need a client and a team member to associate this data with.
        // For simulation, we'll pick the first client and first team member in the company, or generate a dummy one.
        let clientRes = await pool.query('SELECT id FROM clients WHERE company_id = $1 LIMIT 1', [companyId]);
        let teamRes = await pool.query('SELECT id FROM team_members WHERE company_id = $1 LIMIT 1', [companyId]);
        
        if (clientRes.rows.length === 0) {
            // Auto-create a demo client for the mock data
            clientRes = await pool.query('INSERT INTO clients (company_id, name) VALUES ($1, $2) RETURNING id', [companyId, 'Auto-Sync Client']);
        }
        if (teamRes.rows.length === 0) {
            // Auto-create a demo team member
            teamRes = await pool.query('INSERT INTO team_members (company_id, name, email) VALUES ($1, $2, $3) RETURNING id', [companyId, 'Sync Bot', 'bot@performix.local']);
        }
        
        const clientId = clientRes.rows[0].id;
        const teamMemberId = teamRes.rows[0].id;
        const today = new Date().toISOString().split('T')[0];

        // Helper to ensure KPI exists
        const ensureKpi = async (name, type, target) => {
            const check = await pool.query('SELECT id FROM kpi_definitions WHERE company_id = $1 AND name = $2', [companyId, name]);
            if (check.rows.length > 0) return check.rows[0].id;
            const res = await pool.query(
                'INSERT INTO kpi_definitions (company_id, name, type, target_value) VALUES ($1, $2, $3, $4) RETURNING id',
                [companyId, name, type, target]
            );
            return res.rows[0].id;
        };

        // 3. Generate Mock Data based on Platform and insert into Dynamic KPI tables
        if (platform === 'facebook_ads' || platform === 'google_ads') {
            const leads = Math.floor(Math.random() * 50) + 10;
            const kpiName = platform === 'facebook_ads' ? 'Meta Ads Leads' : 'Google Ads Leads';
            const kpiId = await ensureKpi(kpiName, 'numeric', 1000);
            
            await pool.query(
                `INSERT INTO kpi_entries (kpi_id, user_id, date, value, notes) VALUES ($1, $2, $3, $4, $5)`,
                [kpiId, req.user.id, today, leads, `Auto-synced from ${platform}`]
            );
        } 
        else if (platform === 'instagram' || platform === 'tiktok') {
            const followers = Math.floor(Math.random() * 100) + 20;
            const platformName = platform === 'instagram' ? 'Instagram Followers' : 'TikTok Followers';
            const kpiId = await ensureKpi(platformName, 'numeric', 5000);
            
            await pool.query(
                `INSERT INTO kpi_entries (kpi_id, user_id, date, value, notes) VALUES ($1, $2, $3, $4, $5)`,
                [kpiId, req.user.id, today, followers, `Auto-synced from ${platform}`]
            );
        }
        else if (platform === 'google_analytics') {
            const traffic = Math.floor(Math.random() * 500) + 100;
            const kpiId = await ensureKpi('Website Traffic', 'numeric', 10000);
            
            await pool.query(
                `INSERT INTO kpi_entries (kpi_id, user_id, date, value, notes) VALUES ($1, $2, $3, $4, $5)`,
                [kpiId, req.user.id, today, traffic, `Auto-synced from Google Analytics`]
            );
        }
        
        // 4. Update the last_synced_at timestamp
        await pool.query('UPDATE integrations SET last_synced_at = CURRENT_TIMESTAMP WHERE id = $1', [integrationRes.rows[0].id]);
        
        // Log it
        await logActivity(
            req.user.id,
            'integration_synced',
            'integration',
            integrationRes.rows[0].id,
            platform,
            null,
            `${req.user.full_name} synced data for ${platform}`
        );

        res.status(200).json({ message: 'Data synced successfully' });
    } catch (error) {
        console.error('Error syncing integration data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
