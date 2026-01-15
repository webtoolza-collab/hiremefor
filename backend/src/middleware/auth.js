const db = require('../db/connection');

// Middleware to authenticate worker requests
async function authenticateWorker(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const [sessions] = await db.query(
      `SELECT s.*, w.id as worker_id, w.phone_number, w.first_name, w.surname
       FROM worker_sessions s
       JOIN workers w ON s.worker_id = w.id
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.worker = sessions[0];
    req.workerId = sessions[0].worker_id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Middleware to authenticate admin requests
async function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const [sessions] = await db.query(
      `SELECT s.*, a.id as admin_id, a.username
       FROM admin_sessions s
       JOIN main_admin a ON s.admin_id = a.id
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired admin session' });
    }

    req.admin = sessions[0];
    req.adminId = sessions[0].admin_id;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Admin authentication failed' });
  }
}

module.exports = {
  authenticateWorker,
  authenticateAdmin
};
