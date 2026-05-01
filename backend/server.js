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

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const socialMediaRoutes = require('./routes/socialMedia');
const websiteSeoRoutes = require('./routes/websiteSeo');
const adsRoutes = require('./routes/ads');
const emailRoutes = require('./routes/email');
const teamKpiRoutes = require('./routes/teamKpis');
const responseRoutes = require('./routes/responses');
const activityRoutes = require('./routes/activities');
const teamRoutes = require('./routes/team');
const integrationsRoutes = require('./routes/integrations');

// API Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/social-media', authenticateToken, socialMediaRoutes);
app.use('/api/website-seo', authenticateToken, websiteSeoRoutes);
app.use('/api/ads', authenticateToken, adsRoutes);
app.use('/api/email-marketing', authenticateToken, emailRoutes);
app.use('/api/team-kpis', authenticateToken, teamKpiRoutes);
app.use('/api/client-responses', authenticateToken, responseRoutes);
app.use('/api/activities', authenticateToken, activityRoutes);
app.use('/api/team-members', authenticateToken, teamRoutes);
app.use('/api/integrations', authenticateToken, integrationsRoutes);
app.use('/api/kpis', authenticateToken, require('./routes/kpis'));
app.use('/api/ai', authenticateToken, require('./routes/ai'));

// Health check (public)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});