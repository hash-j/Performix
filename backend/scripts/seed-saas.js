const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedSaaSData() {
  try {
    console.log('Seeding SaaS demo data...');
    
    // 1. Create a Company
    const companyRes = await pool.query(`
      INSERT INTO companies (name, industry, subscription_plan) 
      VALUES ($1, $2, $3) RETURNING id
    `, ['Acme SaaS Corp', 'Technology', 'pro']);
    const companyId = companyRes.rows[0].id;
    console.log(`✓ Created Company: Acme SaaS Corp (${companyId})`);

    // 2. Create an Admin User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    const userRes = await pool.query(`
      INSERT INTO users (company_id, full_name, username, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [companyId, 'Admin User', 'admin', 'admin@acmesaas.local', passwordHash, 'admin']);
    const userId = userRes.rows[0].id;
    console.log(`✓ Created User: admin (${userId})`);

    // 3. Create Dynamic KPIs
    const kpiRes1 = await pool.query(`
      INSERT INTO kpi_definitions (company_id, name, type, target_value)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [companyId, 'Monthly Revenue', 'currency', 50000.00]);
    
    const kpiRes2 = await pool.query(`
      INSERT INTO kpi_definitions (company_id, name, type, target_value)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [companyId, 'Closing Ratio', 'percentage', 25.00]);

    console.log('✓ Created KPI Definitions');

    // 4. Create KPI Entries
    await pool.query(`
      INSERT INTO kpi_entries (kpi_id, user_id, date, value, notes)
      VALUES 
      ($1, $2, CURRENT_DATE, 45000.00, 'Strong performance this month'),
      ($3, $2, CURRENT_DATE, 28.50, 'Beat our target ratio!')
    `, [kpiRes1.rows[0].id, userId, kpiRes2.rows[0].id]);
    
    console.log('✓ Created KPI Entries');
    console.log('SaaS seating completed successfully!');

  } catch (err) {
    console.error('Error seeding SaaS data:', err);
  } finally {
    await pool.end();
  }
}

seedSaaSData();
