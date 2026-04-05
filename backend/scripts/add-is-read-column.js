const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addIsReadColumn() {
    const client = await pool.connect();
    try {
        console.log('Checking if is_read column exists...');
        
        // Check if column exists
        const columnCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'activity_log' 
                AND column_name = 'is_read'
            );
        `);
        
        if (columnCheck.rows[0].exists) {
            console.log('✓ is_read column already exists');
        } else {
            console.log('Adding is_read column to activity_log table...');
            
            // Add the is_read column
            await client.query(`
                ALTER TABLE activity_log
                ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
            `);
            
            console.log('✓ is_read column added successfully');
        }
        
        // Create index on is_read for faster queries
        console.log('Creating index on is_read column...');
        try {
            await client.query(`
                CREATE INDEX idx_activity_log_is_read ON activity_log(is_read)
            `);
            console.log('✓ Index created');
        } catch (err) {
            if (err.code === '42P07') { // Index already exists
                console.log('✓ Index already exists');
            } else {
                throw err;
            }
        }
        
        // Show summary
        const unreadCount = await client.query(`
            SELECT COUNT(*) as count FROM activity_log WHERE is_read = FALSE
        `);
        
        const totalCount = await client.query(`
            SELECT COUNT(*) as count FROM activity_log
        `);
        
        console.log(`\nSummary:`);
        console.log(`  Total activities: ${totalCount.rows[0].count}`);
        console.log(`  Unread activities: ${unreadCount.rows[0].count}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

addIsReadColumn();
