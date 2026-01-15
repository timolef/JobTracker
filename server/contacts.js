const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const { authenticateToken } = require('./middleware');

router.use(authenticateToken);

// GET all contacts
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new contact
router.post('/', async (req, res) => {
    const { name, company, role, email, phone, linkedin_url, notes } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO contacts (user_id, name, company, role, email, phone, linkedin_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, company, role, email, phone, linkedin_url, notes]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update contact
router.put('/:id', async (req, res) => {
    const { name, company, role, email, phone, linkedin_url, notes, last_contact_date } = req.body;
    try {
        await pool.query(
            'UPDATE contacts SET name=?, company=?, role=?, email=?, phone=?, linkedin_url=?, notes=?, last_contact_date=? WHERE id=? AND user_id=?',
            [name, company, role, email, phone, linkedin_url, notes, last_contact_date, req.params.id, req.user.id]
        );
        res.json({ message: 'Contact updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE contact
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM contacts WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
        res.json({ message: 'Contact deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
