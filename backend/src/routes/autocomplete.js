const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/skills - Get all skills
router.get('/', async (req, res) => {
  try {
    // Determine which table to query based on the route
    const isSkills = req.baseUrl.includes('skills');
    const table = isSkills ? 'skills' : 'areas';

    const [results] = await db.query(`SELECT * FROM ${table} ORDER BY name`);
    res.json(results);
  } catch (error) {
    console.error(`Get ${req.baseUrl} error:`, error);
    res.status(500).json({ error: 'Failed to get data' });
  }
});

// GET /api/skills/search - Search skills with autocomplete
// GET /api/areas/search - Search areas with autocomplete
router.get('/search', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const isSkills = req.baseUrl.includes('skills');
    const table = isSkills ? 'skills' : 'areas';

    const [results] = await db.query(
      `SELECT * FROM ${table} WHERE name LIKE ? ORDER BY name LIMIT 10`,
      [`%${q}%`]
    );

    res.json(results);
  } catch (error) {
    console.error(`Search ${req.baseUrl} error:`, error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
