const express = require('express');
const { pool } = require('./db');
const { authenticateToken } = require('./middleware');
const router = express.Router();

// GET all applications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM applications WHERE user_id = ? ORDER BY date_applied DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Fetch applications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST new application
router.post('/', authenticateToken, async (req, res) => {
    const { company, position, location, type, status, link, notes } = req.body;

    // Basic validation
    if (!company || !position) {
        return res.status(400).json({ error: 'Company and Position are required' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO applications (user_id, company, position, location, type, status, link, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, company, position, location, type, status || 'Applied', link, notes]
        );

        // Fetch the newly created item to return it
        const [newItem] = await pool.query('SELECT * FROM applications WHERE id = ?', [result.insertId]);
        res.status(201).json(newItem[0]);
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE application status or details
router.put('/:id', authenticateToken, async (req, res) => {
    const appId = req.params.id;
    const fields = req.body;
    const allowedFields = ['company', 'position', 'location', 'type', 'status', 'link', 'notes'];

    try {
        // Ensure the application belongs to the user
        const [check] = await pool.query('SELECT id FROM applications WHERE id = ? AND user_id = ?', [appId, req.user.id]);
        if (check.length === 0) {
            return res.status(404).json({ error: 'Application not found or unauthorized' });
        }

        // Build dynamic query
        const updates = [];
        const values = [];

        for (const key of allowedFields) {
            if (fields[key] !== undefined) {
                updates.push(`${key} = ?`);
                values.push(fields[key]);
            }
        }

        if (updates.length === 0) {
            return res.json({ message: 'No changes provided' });
        }

        values.push(appId);

        await pool.query(
            `UPDATE applications SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Application updated' });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE application
router.delete('/:id', authenticateToken, async (req, res) => {
    const appId = req.params.id;

    try {
        const [result] = await pool.query('DELETE FROM applications WHERE id = ? AND user_id = ?', [appId, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Application not found or unauthorized' });
        }

        res.json({ message: 'Application deleted' });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
