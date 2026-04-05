const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { authenticateToken } = require('./middleware/auth');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to Neon PostgreSQL database');
        release();
    }
});

// Public routes (auth)
app.use('/api/auth', require('./routes/auth'));

// Health check (public)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Protected routes (require authentication)
app.use('/api/kpis', authenticateToken, require('./routes/kpis'));
app.use('/api/ai', authenticateToken, require('./routes/ai'));

app.use('/api/activities', authenticateToken, require('./routes/activities'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});