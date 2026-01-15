const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const { authenticateToken } = require('./middleware');

router.use(authenticateToken);

// GET all interviews
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM interviews WHERE user_id = ? ORDER BY interview_date ASC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new interview
router.post('/', async (req, res) => {
    const { application_id, company, position, interview_date, type, questions, research, notes } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO interviews (user_id, application_id, company, position, interview_date, type, questions, research, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, application_id || null, company, position, interview_date, type, questions, research, notes]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update interview
router.put('/:id', async (req, res) => {
    const { company, position, interview_date, type, questions, research, notes } = req.body;
    try {
        await pool.query(
            'UPDATE interviews SET company=?, position=?, interview_date=?, type=?, questions=?, research=?, notes=? WHERE id=? AND user_id=?',
            [company, position, interview_date, type, questions, research, notes, req.params.id, req.user.id]
        );
        res.json({ message: 'Interview updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE interview
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM interviews WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
        res.json({ message: 'Interview deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
