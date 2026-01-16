const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./db');
const { authenticateToken } = require('./middleware');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

console.log('Auth routes module loaded.');

router.get('/test', (req, res) => {
    res.json({ message: 'Auth API is working' });
});

// Register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);

        const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'User created',
            token,
            user: { id: result.insertId, email, is_premium: false }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, is_premium: !!user.is_premium }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user status
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, is_premium FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: { ...users[0], is_premium: !!users[0].is_premium } });
    } catch (error) {
        console.error('Fetch me error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mock Upgrade to Premium
router.post('/upgrade', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_premium = TRUE WHERE id = ?', [req.user.id]);
        res.json({ message: 'Upgrade successful', is_premium: true });
    } catch (error) {
        console.error('Upgrade error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Downgrade / Cancel Subscription
router.post('/downgrade', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_premium = FALSE WHERE id = ?', [req.user.id]);
        res.json({ message: 'Subscription cancelled', is_premium: false });
    } catch (error) {
        console.error('Downgrade error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
