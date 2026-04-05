const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const initDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log('Initializing database...');
        
        // First, create the update_updated_at_column function
        const updateFunctionSQL = `
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;
        
        await client.query(updateFunctionSQL);
        console.log('✓ Created update_updated_at_column function');
        
        // Create users table if it doesn't exist
        const usersTableSQL = `
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                full_name VARCHAR(255) NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await client.query(usersTableSQL);
        console.log('✓ Created users table');
        
        // Create indexes
        try {
            await client.query('CREATE INDEX idx_users_username ON users(username);');
        } catch (e) {
            // Index may already exist
        }
        
        try {
            await client.query('CREATE INDEX idx_users_email ON users(email);');
        } catch (e) {
            // Index may already exist
        }
        
        // Create trigger for updated_at
        try {
            await client.query(`
                DROP TRIGGER IF EXISTS update_users_updated_at ON users;
                CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            `);
            console.log('✓ Created trigger for updated_at');
        } catch (e) {
            console.log('✓ Trigger already exists or skipped');
        }
        
        console.log('✓ Database initialized successfully');
        
    } catch (error) {
        console.error('Error initializing database:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
};

initDatabase();
