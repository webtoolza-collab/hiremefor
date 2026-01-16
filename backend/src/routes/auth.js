const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { sendOTP, generateOTP } = require('../services/bulksms');

// POST /api/auth/request-otp - Request OTP for registration
router.post('/request-otp', async (req, res) => {
  try {
    const { phone_number } = req.body;

    // Validate phone number (10 digits)
    if (!phone_number || !/^\d{10}$/.test(phone_number)) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    // Check if phone already registered
    const [existing] = await db.query(
      'SELECT id FROM workers WHERE phone_number = ?',
      [phone_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Generate and save OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes

    await db.query(
      `INSERT INTO otp_codes (phone_number, code, purpose, expires_at)
       VALUES (?, ?, 'registration', ?)`,
      [phone_number, otpCode, expiresAt]
    );

    // Send OTP via BulkSMS
    await sendOTP(phone_number, otpCode, 'registration');

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp - Verify OTP code
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone_number, code } = req.body;

    if (!phone_number || !code) {
      return res.status(400).json({ error: 'Phone number and OTP code required' });
    }

    // Find valid OTP
    const currentTime = new Date().toISOString();
    const [otps] = await db.query(
      `SELECT id FROM otp_codes
       WHERE phone_number = ? AND code = ? AND purpose = 'registration'
       AND expires_at > ? AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [phone_number, code, currentTime]
    );

    if (otps.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await db.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [otps[0].id]);

    // Generate temporary token for PIN creation
    const tempToken = uuidv4();

    res.json({
      message: 'OTP verified successfully',
      temp_token: tempToken,
      phone_number
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/create-pin - Create PIN after OTP verification
router.post('/create-pin', async (req, res) => {
  try {
    const { phone_number, pin } = req.body;

    // Validate PIN (4 digits)
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    res.json({
      message: 'PIN created successfully',
      phone_number,
      pin_hash: pinHash
    });
  } catch (error) {
    console.error('Create PIN error:', error);
    res.status(500).json({ error: 'Failed to create PIN' });
  }
});

// POST /api/auth/login - Login with phone and PIN
router.post('/login', async (req, res) => {
  try {
    const { phone_number, pin } = req.body;

    if (!phone_number || !pin) {
      return res.status(400).json({ error: 'Phone number and PIN required' });
    }

    // Find worker
    const [workers] = await db.query(
      'SELECT id, pin_hash, first_name, surname FROM workers WHERE phone_number = ?',
      [phone_number]
    );

    if (workers.length === 0) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    const worker = workers[0];

    // Verify PIN
    const validPin = await bcrypt.compare(pin, worker.pin_hash);
    if (!validPin) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    // Create session
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await db.query(
      `INSERT INTO worker_sessions (worker_id, token, expires_at)
       VALUES (?, ?, ?)`,
      [worker.id, token, expiresAt]
    );

    res.json({
      message: 'Login successful',
      token,
      worker: {
        id: worker.id,
        first_name: worker.first_name,
        surname: worker.surname
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout - Logout and invalidate session
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await db.query('DELETE FROM worker_sessions WHERE token = ?', [token]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/reset-pin-request - Request PIN reset OTP
router.post('/reset-pin-request', async (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number || !/^\d{10}$/.test(phone_number)) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    // Check if phone is registered
    const [workers] = await db.query(
      'SELECT id FROM workers WHERE phone_number = ?',
      [phone_number]
    );

    if (workers.length === 0) {
      return res.status(400).json({ error: 'Phone number not registered' });
    }

    // Generate and save OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes

    await db.query(
      `INSERT INTO otp_codes (phone_number, code, purpose, expires_at)
       VALUES (?, ?, 'pin_reset', ?)`,
      [phone_number, otpCode, expiresAt]
    );

    // Send OTP via BulkSMS
    await sendOTP(phone_number, otpCode, 'pin_reset');

    res.json({ message: 'PIN reset OTP sent successfully' });
  } catch (error) {
    console.error('Reset PIN request error:', error);
    res.status(500).json({ error: 'Failed to send reset OTP' });
  }
});

// POST /api/auth/reset-pin - Reset PIN after OTP verification
router.post('/reset-pin', async (req, res) => {
  try {
    const { phone_number, code, new_pin } = req.body;

    if (!phone_number || !code || !new_pin) {
      return res.status(400).json({ error: 'Phone number, OTP, and new PIN required' });
    }

    if (!/^\d{4}$/.test(new_pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Verify OTP
    const currentTime = new Date().toISOString();
    const [otps] = await db.query(
      `SELECT id FROM otp_codes
       WHERE phone_number = ? AND code = ? AND purpose = 'pin_reset'
       AND expires_at > ? AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [phone_number, code, currentTime]
    );

    if (otps.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await db.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [otps[0].id]);

    // Update PIN
    const pinHash = await bcrypt.hash(new_pin, 10);
    await db.query(
      'UPDATE workers SET pin_hash = ? WHERE phone_number = ?',
      [pinHash, phone_number]
    );

    // Invalidate all existing sessions
    await db.query(
      `DELETE FROM worker_sessions WHERE worker_id = (
        SELECT id FROM workers WHERE phone_number = ?
      )`,
      [phone_number]
    );

    res.json({ message: 'PIN reset successfully' });
  } catch (error) {
    console.error('Reset PIN error:', error);
    res.status(500).json({ error: 'Failed to reset PIN' });
  }
});

module.exports = router;
