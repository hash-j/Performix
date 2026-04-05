const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    console.log('Running migrations...');
    await pool.query(schemaSql);
    console.log('Migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
