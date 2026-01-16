const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const db = require('../db/connection');
const { authenticateWorker } = require('../middleware/auth');

// Configure multer for photo uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'));
    }
  }
});

// GET /api/worker/profile - Get own profile
router.get('/profile', authenticateWorker, async (req, res) => {
  try {
    const [workers] = await db.query(
      `SELECT w.*, a.name as area_name
       FROM workers w
       LEFT JOIN areas a ON w.area_id = a.id
       WHERE w.id = ?`,
      [req.workerId]
    );

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const worker = workers[0];
    delete worker.pin_hash;

    // Get skills
    const [skills] = await db.query(
      `SELECT ws.*, s.name as skill_name
       FROM worker_skills ws
       JOIN skills s ON ws.skill_id = s.id
       WHERE ws.worker_id = ?`,
      [req.workerId]
    );

    // Get average rating
    const [ratingResult] = await db.query(
      `SELECT AVG(stars) as average_rating, COUNT(*) as total_ratings
       FROM ratings
       WHERE worker_id = ? AND status = 'accepted'`,
      [req.workerId]
    );

    res.json({
      ...worker,
      skills,
      average_rating: ratingResult[0].average_rating || 0,
      total_ratings: ratingResult[0].total_ratings || 0
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /api/worker/profile - Update profile
router.put('/profile', authenticateWorker, async (req, res) => {
  try {
    const { first_name, surname, age, gender, area_id, bio, email } = req.body;

    // Validation
    if (!first_name || !surname || !age || !gender || !area_id) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be 500 characters or less' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    await db.query(
      `UPDATE workers
       SET first_name = ?, surname = ?, age = ?, gender = ?, area_id = ?, bio = ?, email = ?
       WHERE id = ?`,
      [first_name, surname, age, gender, area_id, bio || null, email || null, req.workerId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/worker/profile/photo - Upload profile photo
router.post('/profile/photo', authenticateWorker, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    // Process image: resize to square and save
    const filename = `profile_${req.workerId}_${Date.now()}.jpg`;
    const filepath = path.join(__dirname, '../../uploads', filename);

    await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    const photoUrl = `/uploads/${filename}`;

    // Delete old photo if exists
    const [workers] = await db.query(
      'SELECT profile_photo_url FROM workers WHERE id = ?',
      [req.workerId]
    );

    if (workers[0]?.profile_photo_url) {
      const oldPath = path.join(__dirname, '../..', workers[0].profile_photo_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update database
    await db.query(
      'UPDATE workers SET profile_photo_url = ? WHERE id = ?',
      [photoUrl, req.workerId]
    );

    res.json({ message: 'Photo uploaded successfully', photo_url: photoUrl });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// DELETE /api/worker/profile - Delete account
router.delete('/profile', authenticateWorker, async (req, res) => {
  try {
    // Delete worker (cascade will handle related data)
    await db.query('DELETE FROM workers WHERE id = ?', [req.workerId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// GET /api/worker/skills - Get worker's skills
router.get('/skills', authenticateWorker, async (req, res) => {
  try {
    const [skills] = await db.query(
      `SELECT ws.*, s.name as skill_name
       FROM worker_skills ws
       JOIN skills s ON ws.skill_id = s.id
       WHERE ws.worker_id = ?`,
      [req.workerId]
    );

    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

// POST /api/worker/skills - Add skills
router.post('/skills', authenticateWorker, async (req, res) => {
  try {
    const { skills } = req.body; // Array of { skill_id, years_experience }

    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills array required' });
    }

    // First, get current skills for this worker
    const [currentSkills] = await db.query(
      'SELECT skill_id FROM worker_skills WHERE worker_id = ?',
      [req.workerId]
    );
    const currentSkillIds = currentSkills.map(s => s.skill_id);
    const newSkillIds = skills.map(s => s.skill_id);

    // Delete skills that are no longer selected
    const skillsToRemove = currentSkillIds.filter(id => !newSkillIds.includes(id));
    for (const skillId of skillsToRemove) {
      await db.query(
        'DELETE FROM worker_skills WHERE worker_id = ? AND skill_id = ?',
        [req.workerId, skillId]
      );
    }

    // Insert or update skills
    for (const skill of skills) {
      // Check if skill already exists
      const [existing] = await db.query(
        'SELECT id FROM worker_skills WHERE worker_id = ? AND skill_id = ?',
        [req.workerId, skill.skill_id]
      );

      if (existing.length > 0) {
        // Update existing
        await db.query(
          'UPDATE worker_skills SET years_experience = ? WHERE worker_id = ? AND skill_id = ?',
          [skill.years_experience || 0, req.workerId, skill.skill_id]
        );
      } else {
        // Insert new
        await db.query(
          'INSERT INTO worker_skills (worker_id, skill_id, years_experience) VALUES (?, ?, ?)',
          [req.workerId, skill.skill_id, skill.years_experience || 0]
        );
      }
    }

    res.json({ message: 'Skills added successfully' });
  } catch (error) {
    console.error('Add skills error:', error);
    res.status(500).json({ error: 'Failed to add skills' });
  }
});

// PUT /api/worker/skills/:id - Update skill experience
router.put('/skills/:id', authenticateWorker, async (req, res) => {
  try {
    const { years_experience } = req.body;

    await db.query(
      'UPDATE worker_skills SET years_experience = ? WHERE id = ? AND worker_id = ?',
      [years_experience, req.params.id, req.workerId]
    );

    res.json({ message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// DELETE /api/worker/skills/:id - Remove skill
router.delete('/skills/:id', authenticateWorker, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM worker_skills WHERE id = ? AND worker_id = ?',
      [req.params.id, req.workerId]
    );

    res.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ error: 'Failed to remove skill' });
  }
});

// GET /api/worker/ratings - Get all ratings
router.get('/ratings', authenticateWorker, async (req, res) => {
  try {
    const [ratings] = await db.query(
      `SELECT * FROM ratings WHERE worker_id = ? ORDER BY created_at DESC`,
      [req.workerId]
    );

    res.json(ratings);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to get ratings' });
  }
});

// GET /api/worker/ratings/pending - Get pending ratings
router.get('/ratings/pending', authenticateWorker, async (req, res) => {
  try {
    const [ratings] = await db.query(
      `SELECT * FROM ratings WHERE worker_id = ? AND status = 'pending' ORDER BY created_at DESC`,
      [req.workerId]
    );

    res.json(ratings);
  } catch (error) {
    console.error('Get pending ratings error:', error);
    res.status(500).json({ error: 'Failed to get pending ratings' });
  }
});

// PUT /api/worker/ratings/:id/accept - Accept rating
router.put('/ratings/:id/accept', authenticateWorker, async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE ratings SET status = 'accepted', reviewed_at = NOW()
       WHERE id = ? AND worker_id = ? AND status = 'pending'`,
      [req.params.id, req.workerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rating not found or already processed' });
    }

    res.json({ message: 'Rating accepted successfully' });
  } catch (error) {
    console.error('Accept rating error:', error);
    res.status(500).json({ error: 'Failed to accept rating' });
  }
});

// DELETE /api/worker/ratings/:id - Reject rating
router.delete('/ratings/:id', authenticateWorker, async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE ratings SET status = 'rejected', reviewed_at = NOW()
       WHERE id = ? AND worker_id = ? AND status = 'pending'`,
      [req.params.id, req.workerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rating not found or already processed' });
    }

    res.json({ message: 'Rating rejected successfully' });
  } catch (error) {
    console.error('Reject rating error:', error);
    res.status(500).json({ error: 'Failed to reject rating' });
  }
});

// GET /api/worker/stats - Get worker statistics
router.get('/stats', authenticateWorker, async (req, res) => {
  try {
    const [ratingStats] = await db.query(
      `SELECT
         AVG(CASE WHEN status = 'accepted' THEN stars END) as average_rating,
         COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
         COUNT(*) as total_count
       FROM ratings WHERE worker_id = ?`,
      [req.workerId]
    );

    res.json({
      average_rating: ratingStats[0].average_rating || 0,
      accepted_ratings: ratingStats[0].accepted_count || 0,
      pending_ratings: ratingStats[0].pending_count || 0,
      total_ratings: ratingStats[0].total_count || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// POST /api/worker/register - Complete registration with profile
router.post('/register', async (req, res) => {
  try {
    const {
      phone_number, pin_hash, first_name, surname, age,
      gender, area_id, bio, email, skills
    } = req.body;

    // Validation
    if (!phone_number || !pin_hash || !first_name || !surname || !age || !gender || !area_id) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Insert worker
    const [result] = await db.query(
      `INSERT INTO workers (phone_number, pin_hash, first_name, surname, age, gender, area_id, bio, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [phone_number, pin_hash, first_name, surname, age, gender, area_id, bio || null, email || null]
    );

    const workerId = result.insertId;

    // Insert skills
    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        await db.query(
          `INSERT INTO worker_skills (worker_id, skill_id, years_experience) VALUES (?, ?, ?)`,
          [workerId, skill.skill_id, skill.years_experience || 0]
        );
      }
    }

    res.status(201).json({
      message: 'Registration completed successfully',
      worker_id: workerId
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
