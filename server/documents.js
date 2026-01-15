const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./db');
const { authenticateToken } = require('./middleware');
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

if (!process.env.GEMINI_API_KEY) {
    console.error("[GEMINI] ERROR: GEMINI_API_KEY is missing from environment variables!");
} else {
    console.log("[GEMINI] SDK initialized (Key found)");
}

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'server/uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// GET all documents
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Fetch docs error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST Upload File (CV)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, type } = req.body; // type should be 'CV' or 'Other'

    try {
        const [result] = await pool.query(
            'INSERT INTO documents (user_id, name, type, file_path) VALUES (?, ?, ?, ?)',
            [req.user.id, name || req.file.originalname, type || 'CV', req.file.path]
        );

        const [newItem] = await pool.query('SELECT * FROM documents WHERE id = ?', [result.insertId]);
        res.status(201).json(newItem[0]);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST Create Text Document (Cover Letter)
router.post('/create', authenticateToken, async (req, res) => {
    const { name, content, type } = req.body; // type 'CoverLetter'

    if (!name || !content) {
        return res.status(400).json({ error: 'Name and content required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO documents (user_id, name, type, content) VALUES (?, ?, ?, ?)',
            [req.user.id, name, type || 'CoverLetter', content]
        );

        const [newItem] = await pool.query('SELECT * FROM documents WHERE id = ?', [result.insertId]);
        res.status(201).json(newItem[0]);
    } catch (error) {
        console.error('Create doc error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST Generate AI Cover Letter
router.post('/generate-ai', authenticateToken, async (req, res) => {
    const { jobTitle, company, jobDescription } = req.body;

    if (!jobDescription) {
        return res.status(400).json({ error: 'Job description is required' });
    }

    try {
        // 1. Fetch user's latest CV if available for context
        const [docs] = await pool.query(
            'SELECT content FROM documents WHERE user_id = ? AND type = "CV" ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );
        const cvContext = docs.length > 0 ? docs[0].content : "No CV provided.";

        // 2. Call Gemini
        const prompt = `Tu es un expert en recrutement et en rédaction de lettres de motivation en français. 
        Ton but est de rédiger une lettre percutante, professionnelle et personnalisée.

        Rédige une lettre de motivation pour le poste de "${jobTitle}" chez "${company}". 
        
        Description du poste :
        ${jobDescription}

        Mon profil (extrait du CV) :
        ${cvContext}

        La lettre doit être formelle et mettre en avant mes compétences par rapport aux besoins du poste.`;

        const result = await model.generateContent(prompt);
        const generatedText = result.response.text();

        res.json({ content: generatedText });
    } catch (error) {
        console.error('Gemini AI Generation error:', error);
        res.status(500).json({ error: 'Failed to generate cover letter with Gemini.' });
    }
});

// DELETE Document
router.delete('/:id', authenticateToken, async (req, res) => {
    const docId = req.params.id;

    try {
        // Get file path first
        const [docs] = await pool.query('SELECT * FROM documents WHERE id = ? AND user_id = ?', [docId, req.user.id]);
        if (docs.length === 0) return res.status(404).json({ error: 'Not found' });

        const doc = docs[0];

        // Delete from DB
        await pool.query('DELETE FROM documents WHERE id = ?', [docId]);

        // Delete file if exists
        if (doc.file_path) {
            fs.unlink(doc.file_path, (err) => {
                if (err) console.error('Failed to delete file:', err);
            });
        }

        res.json({ message: 'Document deleted' });
    } catch (error) {
        console.error('Delete doc error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DOWNLOAD Document
router.get('/:id/download', authenticateToken, async (req, res) => {
    const docId = req.params.id;
    try {
        const [docs] = await pool.query('SELECT * FROM documents WHERE id = ? AND user_id = ?', [docId, req.user.id]);
        if (docs.length === 0) return res.status(404).json({ error: 'Not found' });

        const doc = docs[0];

        if (doc.file_path) {
            res.download(doc.file_path, doc.name); // Set disposition and send it.
        } else if (doc.content) {
            // Send as text file
            res.set('Content-Disposition', `attachment; filename="${doc.name}.txt"`);
            res.set('Content-Type', 'text/plain');
            res.send(doc.content);
        } else {
            res.status(400).json({ error: 'Empty document' });
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// VIEW Document (Inline)
router.get('/:id/view', authenticateToken, async (req, res) => {
    const docId = req.params.id;
    try {
        const [docs] = await pool.query('SELECT * FROM documents WHERE id = ? AND user_id = ?', [docId, req.user.id]);
        if (docs.length === 0) return res.status(404).json({ error: 'Not found' });

        const doc = docs[0];

        if (doc.file_path) {
            res.setHeader('Content-Disposition', `inline; filename="${doc.name}"`);
            res.sendFile(path.resolve(doc.file_path));
        } else if (doc.content) {
            res.setHeader('Content-Disposition', `inline; filename="${doc.name}.txt"`);
            res.setHeader('Content-Type', 'text/plain');
            res.send(doc.content);
        } else {
            res.status(400).json({ error: 'Empty document' });
        }
    } catch (error) {
        console.error('View error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE Document (Rename)
router.put('/:id', authenticateToken, async (req, res) => {
    const docId = req.params.id;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const [docs] = await pool.query('SELECT * FROM documents WHERE id = ? AND user_id = ?', [docId, req.user.id]);
        if (docs.length === 0) return res.status(404).json({ error: 'Not found' });

        await pool.query('UPDATE documents SET name = ? WHERE id = ?', [name, docId]);

        // Return updated object
        const [updated] = await pool.query('SELECT * FROM documents WHERE id = ?', [docId]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
