const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initializeActivityTable() {
    const client = await pool.connect();
    try {
        console.log('Checking for activity_log table...');
        
        // Check if table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'activity_log'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✓ activity_log table already exists');
            
            // Check record count
            const countResult = await client.query('SELECT COUNT(*) FROM activity_log');
            console.log(`  Records in activity_log: ${countResult.rows[0].count}`);
            
            // Show recent activities
            const recentResult = await client.query(`
                SELECT al.id, al.action_type, al.entity_type, al.entity_name, al.created_at, u.full_name
                FROM activity_log al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC
                LIMIT 5
            `);
            
            if (recentResult.rows.length > 0) {
                console.log('\n✓ Recent activities:');
                recentResult.rows.forEach(row => {
                    console.log(`  - [${row.action_type}] ${row.entity_type}: ${row.entity_name} by ${row.full_name || 'Unknown'} at ${row.created_at}`);
                });
            } else {
                console.log('  No activities recorded yet');
            }
        } else {
            console.log('✗ activity_log table does NOT exist. Creating...');
            
            // Create the table
            await client.query(`
                CREATE TABLE IF NOT EXISTS activity_log (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('user_added', 'user_edited', 'client_added', 'client_edited', 'team_member_added', 'team_member_edited', 'data_added', 'data_edited', 'report_generated')),
                    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('user', 'client', 'team_member', 'social_media', 'ads', 'email_marketing', 'website_seo', 'client_responses', 'team_kpis')),
                    entity_id UUID,
                    entity_name VARCHAR(255),
                    tab_name VARCHAR(50),
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            
            // Create indexes
            await client.query('CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC)');
            await client.query('CREATE INDEX idx_activity_log_user_id ON activity_log(user_id)');
            await client.query('CREATE INDEX idx_activity_log_action_type ON activity_log(action_type)');
            
            console.log('✓ activity_log table created successfully');
            console.log('✓ Indexes created');
        }
        
        // Check if users table has records
        const usersResult = await client.query('SELECT COUNT(*) FROM users');
        console.log(`\nUsers in database: ${usersResult.rows[0].count}`);
        
        // Show current user structure
        const userStructure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.log('\nUsers table structure:');
        userStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

initializeActivityTable();
