const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/search/workers - Search workers with filters
router.get('/workers', async (req, res) => {
  try {
    const {
      skill_id,
      area_id,
      page = 1,
      limit = 10,
      sort_by = 'first_name',
      sort_order = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const validLimits = [10, 20, 50];
    const actualLimit = validLimits.includes(parseInt(limit)) ? parseInt(limit) : 10;

    // Valid sort columns
    const validSorts = ['first_name', 'surname', 'age', 'rating'];
    const sortColumn = validSorts.includes(sort_by) ? sort_by : 'first_name';
    const sortDir = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (area_id) {
      whereClause += ' AND w.area_id = ?';
      params.push(area_id);
    }

    if (skill_id) {
      whereClause += ' AND EXISTS (SELECT 1 FROM worker_skills ws WHERE ws.worker_id = w.id AND ws.skill_id = ?)';
      params.push(skill_id);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT w.id) as total FROM workers w ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Build order clause
    let orderClause;
    if (sortColumn === 'rating') {
      orderClause = `ORDER BY avg_rating ${sortDir} NULLS LAST, w.first_name ASC`;
    } else {
      orderClause = `ORDER BY w.${sortColumn} ${sortDir}`;
    }

    // Get workers with average rating
    const [workers] = await db.query(
      `SELECT
         w.id, w.first_name, w.surname, w.age, w.gender,
         w.profile_photo_url, w.bio,
         a.name as area_name,
         (SELECT AVG(stars) FROM ratings r WHERE r.worker_id = w.id AND r.status = 'accepted') as avg_rating,
         (SELECT COUNT(*) FROM ratings r WHERE r.worker_id = w.id AND r.status = 'accepted') as rating_count
       FROM workers w
       LEFT JOIN areas a ON w.area_id = a.id
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, actualLimit, offset]
    );

    // Get skills for each worker
    for (const worker of workers) {
      const [skills] = await db.query(
        `SELECT s.name, ws.years_experience
         FROM worker_skills ws
         JOIN skills s ON ws.skill_id = s.id
         WHERE ws.worker_id = ?`,
        [worker.id]
      );
      worker.skills = skills;
    }

    res.json({
      workers,
      pagination: {
        total,
        page: parseInt(page),
        limit: actualLimit,
        total_pages: Math.ceil(total / actualLimit)
      }
    });
  } catch (error) {
    console.error('Search workers error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/workers/:id - Get public worker profile
router.get('/:id', async (req, res) => {
  try {
    const [workers] = await db.query(
      `SELECT
         w.id, w.first_name, w.surname, w.age, w.gender,
         w.phone_number, w.email, w.bio, w.profile_photo_url,
         a.name as area_name
       FROM workers w
       LEFT JOIN areas a ON w.area_id = a.id
       WHERE w.id = ?`,
      [req.params.id]
    );

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const worker = workers[0];

    // Get skills
    const [skills] = await db.query(
      `SELECT s.name, ws.years_experience
       FROM worker_skills ws
       JOIN skills s ON ws.skill_id = s.id
       WHERE ws.worker_id = ?`,
      [worker.id]
    );

    // Get average rating
    const [ratingResult] = await db.query(
      `SELECT AVG(stars) as average_rating, COUNT(*) as total_ratings
       FROM ratings
       WHERE worker_id = ? AND status = 'accepted'`,
      [worker.id]
    );

    res.json({
      ...worker,
      skills,
      average_rating: ratingResult[0].average_rating || 0,
      total_ratings: ratingResult[0].total_ratings || 0
    });
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ error: 'Failed to get worker' });
  }
});

// POST /api/workers/:id/rate - Submit rating for worker
router.post('/:id/rate', async (req, res) => {
  try {
    const { stars, comment } = req.body;

    // Validate stars
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }

    // Check worker exists
    const [workers] = await db.query(
      'SELECT id FROM workers WHERE id = ?',
      [req.params.id]
    );

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Insert rating
    await db.query(
      `INSERT INTO ratings (worker_id, stars, comment, status)
       VALUES (?, ?, ?, 'pending')`,
      [req.params.id, stars, comment || null]
    );

    res.status(201).json({
      message: 'Rating submitted successfully. It will be visible after the worker approves it.'
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
