require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { scrapeJobs } = require('./scraper');
const { initDB } = require('./db');
const authRoutes = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS & Security Headers (MUST BE FIRST)
const allowedOrigins = [
    'https://job-tracker-ten-sooty.vercel.app',
    'http://localhost:5173',
    'http://localhost:4173',
    'https://jobtracker-production-03e6.up.railway.app'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // Allow non-browser requests
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // CORS Headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, Pragma, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');

    // 2. NO-CACHE Headers (Requested by user)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// Initialize Database
initDB();


app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
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

// 404 Handler for debugging
app.use((req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
