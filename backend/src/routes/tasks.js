const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// ── GET /api/tasks  — list all tasks (optional ?status= filter) ──
router.get('/', async (req, res) => {
  const { status } = req.query;
  try {
    const { rows } = status
      ? await pool.query('SELECT * FROM tasks WHERE status=$1 ORDER BY created_at DESC', [status])
      : await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/tasks/:id  — single task ───────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/tasks  — create task ──────────────────────────────
router.post('/', async (req, res) => {
  const { title, description, priority = 'medium' } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, priority)
       VALUES ($1, $2, $3) RETURNING *`,
      [title.trim(), description || null, priority]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/tasks/:id  — update status / title / etc ─────────
router.patch('/:id', async (req, res) => {
  const allowed = ['title', 'description', 'status', 'priority'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

  const setClauses = updates.map(([k], i) => `${k}=$${i + 1}`).join(', ');
  const values = updates.map(([, v]) => v);
  values.push(req.params.id);

  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET ${setClauses}, updated_at=NOW()
       WHERE id=$${values.length} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/tasks/:id  ───────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
