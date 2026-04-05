const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedDemoData() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../../database/demo-data.sql'), 'utf8');
    console.log('Inserting demo data...');
    await pool.query(sql);
    console.log('Demo data inserted successfully!');
  } catch (err) {
    console.error('Error seeding demo data:', err);
  } finally {
    await pool.end();
  }
}

seedDemoData();
