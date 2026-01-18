const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const db = require('./db');
const { authenticateToken } = require('./middleware');

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/callback'
);

// Scopes for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

/**
 * GET /api/calendar/auth-url
 * Generate Google OAuth URL for user authentication
 */
router.get('/auth-url', authenticateToken, (req, res) => {
    try {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            state: req.user.id.toString(), // Pass user ID for callback
            prompt: 'consent' // Force consent to get refresh token
        });

        res.json({ authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
});

/**
 * GET /api/calendar/callback
 * Handle OAuth callback and exchange code for tokens
 */
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews?error=auth_failed`);
    }

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Calculate token expiry
        const expiryDate = new Date(Date.now() + (tokens.expiry_date || 3600000));

        // Store tokens in database
        await db.query(
            `UPDATE users 
             SET google_access_token = ?, 
                 google_refresh_token = ?, 
                 google_token_expiry = ? 
             WHERE id = ?`,
            [
                tokens.access_token,
                tokens.refresh_token || null,
                expiryDate,
                parseInt(state)
            ]
        );

        // Redirect back to interviews page with success
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews?google_connected=true`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/interviews?error=auth_failed`);
    }
});

/**
 * GET /api/calendar/status
 * Check if user has connected Google Calendar
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT google_access_token, google_token_expiry FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.json({ connected: false });
        }

        const user = rows[0];
        const hasToken = !!user.google_access_token;
        const isExpired = user.google_token_expiry ? new Date(user.google_token_expiry) < new Date() : true;

        res.json({
            connected: hasToken && !isExpired,
            needsReauth: hasToken && isExpired
        });
    } catch (error) {
        console.error('Error checking calendar status:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

/**
 * POST /api/calendar/import
 * Fetch calendar events and return them for import
 */
router.post('/import', authenticateToken, async (req, res) => {
    try {
        // Get user's tokens from database
        const [rows] = await db.query(
            'SELECT google_access_token, google_refresh_token, google_token_expiry FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0 || !rows[0].google_access_token) {
            return res.status(401).json({ error: 'Google Calendar not connected' });
        }

        const user = rows[0];

        // Set credentials
        oauth2Client.setCredentials({
            access_token: user.google_access_token,
            refresh_token: user.google_refresh_token
        });

        // Check if token needs refresh
        if (new Date(user.google_token_expiry) < new Date()) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();

                // Update tokens in database
                await db.query(
                    `UPDATE users 
                     SET google_access_token = ?, 
                         google_token_expiry = ? 
                     WHERE id = ?`,
                    [
                        credentials.access_token,
                        new Date(credentials.expiry_date),
                        req.user.id
                    ]
                );

                oauth2Client.setCredentials(credentials);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                return res.status(401).json({ error: 'Token expired, please reconnect' });
            }
        }

        // Initialize Calendar API
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Fetch events from next 60 days
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items || [];

        // Filter and map events that might be interviews
        const interviewKeywords = ['interview', 'entretien', 'entrevue', 'meeting', 'call', 'discussion'];

        const potentialInterviews = events
            .filter(event => {
                const summary = (event.summary || '').toLowerCase();
                return interviewKeywords.some(keyword => summary.includes(keyword));
            })
            .map(event => ({
                googleEventId: event.id,
                summary: event.summary,
                description: event.description || '',
                location: event.location || '',
                startTime: event.start.dateTime || event.start.date,
                endTime: event.end.dateTime || event.end.date,
                hangoutLink: event.hangoutLink || '',
                // Suggested mapping
                suggestedCompany: extractCompany(event.summary),
                suggestedPosition: extractPosition(event.summary),
                suggestedType: determineType(event)
            }));

        res.json({ events: potentialInterviews });
    } catch (error) {
        console.error('Error importing calendar:', error);
        res.status(500).json({ error: 'Failed to import calendar events' });
    }
});

/**
 * DELETE /api/calendar/disconnect
 * Disconnect Google Calendar by removing tokens
 */
router.delete('/disconnect', authenticateToken, async (req, res) => {
    try {
        await db.query(
            `UPDATE users 
             SET google_access_token = NULL, 
                 google_refresh_token = NULL, 
                 google_token_expiry = NULL 
             WHERE id = ?`,
            [req.user.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting calendar:', error);
        res.status(500).json({ error: 'Failed to disconnect' });
    }
});

// Helper functions
function extractCompany(summary) {
    // Try to extract company name from patterns like "Interview @ Company" or "Company - Interview"
    const patterns = [
        /(?:interview|entretien).*?(?:@|at|chez)\s+([^-\n]+)/i,
        /([^-\n]+?)\s*-\s*(?:interview|entretien)/i
    ];

    for (const pattern of patterns) {
        const match = summary.match(pattern);
        if (match) return match[1].trim();
    }

    return '';
}

function extractPosition(summary) {
    // Try to extract position from patterns
    const patterns = [
        /(?:interview|entretien).*?(?:for|pour)\s+([^@\n]+)/i,
        /([^-@\n]+?)\s*(?:interview|entretien)/i
    ];

    for (const pattern of patterns) {
        const match = summary.match(pattern);
        if (match) return match[1].trim();
    }

    return '';
}

function determineType(event) {
    const hasVideoLink = !!(event.hangoutLink || (event.description && event.description.includes('zoom')));
    const hasLocation = !!event.location;

    if (hasVideoLink) return 'Video';
    if (hasLocation) return 'On-site';
    return 'Phone';
}

module.exports = router;
