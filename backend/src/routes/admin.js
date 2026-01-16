const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { authenticateAdmin } = require('../middleware/auth');

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [admins] = await db.query(
      'SELECT id, username, password_hash FROM main_admin WHERE username = ?',
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await db.query(
      `INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)`,
      [admin.id, token, expiresAt]
    );

    res.json({
      message: 'Login successful',
      token,
      admin: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/admin/logout - Admin logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await db.query('DELETE FROM admin_sessions WHERE token = ?', [token]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/admin/dashboard - Dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const [workerCount] = await db.query('SELECT COUNT(*) as count FROM workers');
    const [ratingCount] = await db.query('SELECT COUNT(*) as count FROM ratings');
    const [skillCount] = await db.query('SELECT COUNT(*) as count FROM skills');
    const [areaCount] = await db.query('SELECT COUNT(*) as count FROM areas');

    const [recentWorkers] = await db.query(
      `SELECT id, first_name, surname, phone_number, created_at
       FROM workers ORDER BY created_at DESC LIMIT 10`
    );

    res.json({
      stats: {
        total_workers: workerCount[0].count,
        total_ratings: ratingCount[0].count,
        total_skills: skillCount[0].count,
        total_areas: areaCount[0].count
      },
      recent_workers: recentWorkers
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// GET /api/admin/workers - List all workers
router.get('/workers', authenticateAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];

    if (search) {
      whereClause = 'WHERE w.first_name LIKE ? OR w.surname LIKE ? OR w.phone_number LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM workers w ${whereClause}`,
      params
    );

    const [workers] = await db.query(
      `SELECT w.*, a.name as area_name
       FROM workers w
       LEFT JOIN areas a ON w.area_id = a.id
       ${whereClause}
       ORDER BY w.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Remove sensitive data
    workers.forEach(w => delete w.pin_hash);

    res.json({
      workers,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List workers error:', error);
    res.status(500).json({ error: 'Failed to list workers' });
  }
});

// GET /api/admin/workers/:id - Get worker details
router.get('/workers/:id', authenticateAdmin, async (req, res) => {
  try {
    const [workers] = await db.query(
      `SELECT w.*, a.name as area_name
       FROM workers w
       LEFT JOIN areas a ON w.area_id = a.id
       WHERE w.id = ?`,
      [req.params.id]
    );

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const worker = workers[0];
    delete worker.pin_hash;

    // Get skills
    const [skills] = await db.query(
      `SELECT s.name, ws.years_experience
       FROM worker_skills ws
       JOIN skills s ON ws.skill_id = s.id
       WHERE ws.worker_id = ?`,
      [worker.id]
    );

    // Get ratings
    const [ratings] = await db.query(
      `SELECT * FROM ratings WHERE worker_id = ? ORDER BY created_at DESC`,
      [worker.id]
    );

    res.json({ ...worker, skills, ratings });
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ error: 'Failed to get worker' });
  }
});

// DELETE /api/admin/workers/:id - Remove worker
router.delete('/workers/:id', authenticateAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM workers WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({ message: 'Worker removed successfully' });
  } catch (error) {
    console.error('Remove worker error:', error);
    res.status(500).json({ error: 'Failed to remove worker' });
  }
});

// GET /api/admin/skills - List all skills
router.get('/skills', authenticateAdmin, async (req, res) => {
  try {
    const [skills] = await db.query(
      `SELECT s.*,
         (SELECT COUNT(*) FROM worker_skills ws WHERE ws.skill_id = s.id) as worker_count
       FROM skills s ORDER BY s.name`
    );

    res.json(skills);
  } catch (error) {
    console.error('List skills error:', error);
    res.status(500).json({ error: 'Failed to list skills' });
  }
});

// POST /api/admin/skills - Add skill
router.post('/skills', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name required' });
    }

    const [result] = await db.query(
      'INSERT INTO skills (name) VALUES (?)',
      [name.trim()]
    );

    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (error) {
    console.error('Add skill error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Skill already exists' });
    }
    res.status(500).json({ error: 'Failed to add skill' });
  }
});

// PUT /api/admin/skills/:id - Edit skill
router.put('/skills/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name required' });
    }

    const [result] = await db.query(
      'UPDATE skills SET name = ? WHERE id = ?',
      [name.trim(), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Edit skill error:', error);
    res.status(500).json({ error: 'Failed to edit skill' });
  }
});

// DELETE /api/admin/skills/:id - Delete skill
router.delete('/skills/:id', authenticateAdmin, async (req, res) => {
  try {
    // Check if skill is in use
    const [usage] = await db.query(
      'SELECT COUNT(*) as count FROM worker_skills WHERE skill_id = ?',
      [req.params.id]
    );

    if (usage[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete skill - it is currently assigned to workers'
      });
    }

    const [result] = await db.query('DELETE FROM skills WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// GET /api/admin/areas - List all areas
router.get('/areas', authenticateAdmin, async (req, res) => {
  try {
    const [areas] = await db.query(
      `SELECT a.*,
         (SELECT COUNT(*) FROM workers w WHERE w.area_id = a.id) as worker_count
       FROM areas a ORDER BY a.name`
    );

    res.json(areas);
  } catch (error) {
    console.error('List areas error:', error);
    res.status(500).json({ error: 'Failed to list areas' });
  }
});

// POST /api/admin/areas - Add area
router.post('/areas', authenticateAdmin, async (req, res) => {
  try {
    const { name, province } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Area name required' });
    }

    const [result] = await db.query(
      'INSERT INTO areas (name, province) VALUES (?, ?)',
      [name.trim(), province || null]
    );

    res.status(201).json({ id: result.insertId, name: name.trim(), province });
  } catch (error) {
    console.error('Add area error:', error);
    res.status(500).json({ error: 'Failed to add area' });
  }
});

// PUT /api/admin/areas/:id - Edit area
router.put('/areas/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, province } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Area name required' });
    }

    const [result] = await db.query(
      'UPDATE areas SET name = ?, province = ? WHERE id = ?',
      [name.trim(), province || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    res.json({ message: 'Area updated successfully' });
  } catch (error) {
    console.error('Edit area error:', error);
    res.status(500).json({ error: 'Failed to edit area' });
  }
});

// DELETE /api/admin/areas/:id - Delete area
router.delete('/areas/:id', authenticateAdmin, async (req, res) => {
  try {
    // Check if area is in use
    const [usage] = await db.query(
      'SELECT COUNT(*) as count FROM workers WHERE area_id = ?',
      [req.params.id]
    );

    if (usage[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete area - workers are registered in this area'
      });
    }

    const [result] = await db.query('DELETE FROM areas WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    res.json({ message: 'Area deleted successfully' });
  } catch (error) {
    console.error('Delete area error:', error);
    res.status(500).json({ error: 'Failed to delete area' });
  }
});

// GET /api/admin/ratings - List all ratings
router.get('/ratings', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];

    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      whereClause = 'WHERE r.status = ?';
      params.push(status);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM ratings r ${whereClause}`,
      params
    );

    const [ratings] = await db.query(
      `SELECT r.*, w.first_name, w.surname, w.phone_number
       FROM ratings r
       JOIN workers w ON r.worker_id = w.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      ratings,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List ratings error:', error);
    res.status(500).json({ error: 'Failed to list ratings' });
  }
});

module.exports = router;
