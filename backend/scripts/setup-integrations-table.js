const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Zu4SO8HLEJBX@ep-lingering-mountain-a1ntbxb1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

const run = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        platform VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'connected',
        last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, platform)
      );
    `);
    console.log('Integrations table created');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
