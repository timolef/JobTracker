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
    const { name, company, role, email, phone, linkedin_url, notes, follow_up_date, follow_up_frequency, relationship_strength } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO contacts (user_id, name, company, role, email, phone, linkedin_url, notes, follow_up_date, follow_up_frequency, relationship_strength) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, company, role, email, phone, linkedin_url, notes, follow_up_date || null, follow_up_frequency || 30, relationship_strength || 'Medium']
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update contact
router.put('/:id', async (req, res) => {
    const { name, company, role, email, phone, linkedin_url, notes, last_contact_date, follow_up_date, follow_up_frequency, relationship_strength } = req.body;
    try {
        await pool.query(
            'UPDATE contacts SET name=?, company=?, role=?, email=?, phone=?, linkedin_url=?, notes=?, last_contact_date=?, follow_up_date=?, follow_up_frequency=?, relationship_strength=? WHERE id=? AND user_id=?',
            [name, company, role, email, phone, linkedin_url, notes, last_contact_date, follow_up_date, follow_up_frequency, relationship_strength, req.params.id, req.user.id]
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

// --- INTERACTIONS ---

// GET interactions for a contact
router.get('/:id/interactions', async (req, res) => {
    try {
        // Verify ownership
        const [contacts] = await pool.query('SELECT id FROM contacts WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
        if (contacts.length === 0) return res.status(404).json({ error: 'Contact not found' });

        const [rows] = await pool.query('SELECT * FROM interactions WHERE contact_id=? ORDER BY date DESC', [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST interaction
router.post('/:id/interactions', async (req, res) => {
    const { type, date, notes } = req.body;
    try {
        // Verify ownership
        const [contacts] = await pool.query('SELECT * FROM contacts WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
        if (contacts.length === 0) return res.status(404).json({ error: 'Contact not found' });

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert interaction
            const [result] = await connection.query(
                'INSERT INTO interactions (contact_id, type, date, notes) VALUES (?, ?, ?, ?)',
                [req.params.id, type || 'Email', date || new Date(), notes]
            );

            // Update contact last_contact_date and next follow_up
            const interactionDate = new Date(date || new Date());
            const frequency = contacts[0].follow_up_frequency || 30;
            const nextFollowUp = new Date(interactionDate);
            nextFollowUp.setDate(nextFollowUp.getDate() + frequency);

            await connection.query(
                'UPDATE contacts SET last_contact_date = ?, follow_up_date = ? WHERE id = ?',
                [interactionDate, nextFollowUp, req.params.id]
            );

            await connection.commit();
            res.status(201).json({ id: result.insertId, type, date, notes });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
