const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ==========================================
// 1. KPI DEFINITIONS
// ==========================================

// Get all KPI Definitions for the current user's company
router.get('/definitions', async (req, res) => {
  try {
    const { company_id } = req.user;
    if (!company_id) return res.status(403).json({ error: 'User is not linked to a company' });

    const result = await db.query(
      'SELECT * FROM kpi_definitions WHERE company_id = $1 ORDER BY created_at ASC',
      [company_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching KPI definitions:', error);
    res.status(500).json({ error: 'Failed to fetch KPI definitions' });
  }
});

// Create a new KPI Definition (Requires Admin/Manager)
router.post('/definitions', async (req, res) => {
  try {
    const { company_id, role } = req.user;
    if (!['superadmin', 'admin', 'manager'].includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions to create KPIs' });
    }

    const { name, type, target_value } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    // ENFORCE SUBSCRIPTION LIMITS (Phase 2)
    const companyRes = await db.query('SELECT subscription_plan FROM companies WHERE id = $1', [company_id]);
    const plan = companyRes.rows[0]?.subscription_plan || 'free';

    if (plan === 'free') {
      const countRes = await db.query('SELECT COUNT(*) FROM kpi_definitions WHERE company_id = $1', [company_id]);
      if (parseInt(countRes.rows[0].count) >= 3) {
        return res.status(403).json({ error: 'Free plan is limited to 3 KPIs. Please upgrade your workspace to PRO to add more.' });
      }
    }

    const result = await db.query(
      `INSERT INTO kpi_definitions (company_id, name, type, target_value) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [company_id, name, type, target_value]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating KPI definition:', error);
    res.status(500).json({ error: 'Failed to create KPI definition' });
  }
});

// Delete a KPI Definition
router.delete('/definitions/:id', async (req, res) => {
  try {
    const { company_id, role } = req.user;
    if (!['superadmin', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions to delete KPIs' });
    }

    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM kpi_definitions WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, company_id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'KPI not found' });
    res.json({ message: 'KPI deleted successfully' });
  } catch (error) {
    console.error('Error deleting KPI definition:', error);
    res.status(500).json({ error: 'Failed to delete KPI definition' });
  }
});

// ==========================================
// 2. KPI ENTRIES (THE DATA)
// ==========================================

// Get all KPI Entries for the user's company
router.get('/entries', async (req, res) => {
  try {
    const { company_id } = req.user;

    // Join with definitions to ensure isolation
    const result = await db.query(
      `SELECT e.*, d.name, d.type, d.target_value, u.full_name as author_name 
       FROM kpi_entries e
       JOIN kpi_definitions d ON e.kpi_id = d.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE d.company_id = $1
       ORDER BY e.date DESC`,
      [company_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching KPI entries:', error);
    res.status(500).json({ error: 'Failed to fetch KPI entries' });
  }
});

// Create a new KPI Entry (Logging data)
router.post('/entries', async (req, res) => {
  try {
    const { company_id, id: user_id } = req.user;
    const { kpi_id, date, value, notes } = req.body;

    if (!kpi_id || !date || value === undefined) {
      return res.status(400).json({ error: 'KPI ID, Date, and Value are required' });
    }

    // Verify the KPI belongs to the user's company
    const kpiCheck = await db.query('SELECT id FROM kpi_definitions WHERE id = $1 AND company_id = $2', [kpi_id, company_id]);
    if (kpiCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized KPI access' });
    }

    const result = await db.query(
      `INSERT INTO kpi_entries (kpi_id, user_id, date, value, notes) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [kpi_id, user_id, date, value, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating KPI entry:', error);
    res.status(500).json({ error: 'Failed to log KPI entry' });
  }
});

module.exports = router;
