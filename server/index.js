require('dotenv').config();
const express = require('express');
const { scrapeJobs } = require('./scraper');
const { initDB } = require('./db');
const authRoutes = require('./auth');

// Express Initialization
const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS & Security Headers (MUST BE FIRST)
app.use((req, res, next) => {
    const origin = req.header('Origin') || req.header('origin');

    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, Pragma, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Vary', 'Origin');

    // 2. NO-CACHE Headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        time: new Date().toISOString(),
        node: process.version,
        env: process.env.NODE_ENV || 'production'
    });
});

app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', require('./applications'));
app.use('/api/documents', require('./documents'));
app.use('/api/contacts', require('./contacts'));
app.use('/api/interviews', require('./interviews'));

app.post('/api/scrape', async (req, res) => {
    const { platform, keyword, location, limit } = req.body;

    if (!platform || !keyword) {
        return res.status(400).json({ error: 'Platform and keyword are required' });
    }

    console.log(`Received scrape request for ${platform}: ${keyword} in ${location} (Limit: ${limit || 15})`);

    try {
        const jobs = await scrapeJobs(platform, keyword, location, limit || 15);
        console.log(`Found ${jobs.length} jobs`);
        res.json(jobs);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to scrape jobs' });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================`);
    console.log(`🚀 Server starting on 0.0.0.0:${PORT}`);
    console.log(`🕒 ${new Date().toISOString()}`);
    console.log(`=================================`);

    // Initialize Database after server is up
    console.log('⏳ Initializing database...');
    initDB().then(() => {
        console.log('✅ Database connected and initialized.');
    }).catch(err => {
        console.error('❌ Database initialization CRASH:', err);
        // We don't exit here anymore to allow /api/health to work for debugging
    });
});
