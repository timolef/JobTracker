const express = require('express');
const cors = require('cors');
const { scrapeJobs } = require('./scraper');
const { initDB } = require('./db');
const authRoutes = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
initDB();

// Manual CORS Middleware to fix persistent issues
app.use((req, res, next) => {
    const allowedOrigins = ['https://job-tracker-ten-sooty.vercel.app', 'http://localhost:5173', 'http://localhost:4173', 'https://jobtracker-production-03e6.up.railway.app'];
    const origin = req.headers.origin;
    console.log(`[CORS] Request Origin: ${origin}, Allowed: ${allowedOrigins.includes(origin)}`);

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight immediately
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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
