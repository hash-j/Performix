const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedMoreData() {
  try {
    console.log('Generating 30 rows of demo timeline data for existing KPIs...');
    
    // Get the admin user and company
    const userRes = await pool.query(`SELECT id, company_id FROM users WHERE username = 'admin' LIMIT 1`);
    if (userRes.rowCount === 0) {
        console.error('Admin user not found. Please run seed-saas.js first.');
        return;
    }
    const { id: userId, company_id: companyId } = userRes.rows[0];

    // Get the KPIs for this company
    const kpiRes = await pool.query(`SELECT id, name, type, target_value FROM kpi_definitions WHERE company_id = $1`, [companyId]);
    if (kpiRes.rowCount === 0) {
        console.error('No KPIs found for this company.');
        return;
    }

    const kpis = kpiRes.rows;
    let entriesCreated = 0;

    for (const kpi of kpis) {
        console.log(`Seeding data for KPI: ${kpi.name}`);
        
        let currentValue = kpi.target_value * 0.5; // Start at 50% of target
        const isRevenue = kpi.type === 'currency';
        const isPercentage = kpi.type === 'percentage';

        // Generate 30 days of data ending today
        for (let i = 30; i >= 1; i--) {
            // Add some random fluctuation but generally trending up
            const fluctuation = (Math.random() - 0.3) * (kpi.target_value * 0.05);
            currentValue += fluctuation;
            
            // Prevents negatives
            if (currentValue < 0) currentValue = 0;

            const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            let note = null;
            if (i % 7 === 0) {
                note = 'Weekly review logged status.';
            }

            await pool.query(`
              INSERT INTO kpi_entries (kpi_id, user_id, date, value, notes)
              VALUES ($1, $2, $3, $4, $5)
            `, [kpi.id, userId, dateStr, currentValue.toFixed(2), note]);
            
            entriesCreated++;
        }
    }

    console.log(`✓ Successfully inserted ${entriesCreated} historical entries across ${kpis.length} KPIs!`);
  } catch (err) {
    console.error('Error seeding demo data:', err);
  } finally {
    await pool.end();
  }
}

seedMoreData();
