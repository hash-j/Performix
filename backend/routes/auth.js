const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { logActivity } = require('../middleware/activityLog');
const bcrypt = require('bcryptjs');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Register a new company and admin user (SaaS Onboarding)
router.post('/register', async (req, res) => {
  try {
    const { company_name, industry, full_name, username, email, password } = req.body;

    // Validate input
    if (!company_name || !full_name || !username || !email || !password) {
      return res.status(400).json({ error: 'Company Name, Full Name, Username, Email, and Password are required' });
    }

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Use transaction to ensure both company and user are created or neither
    await db.query('BEGIN');

    // 1. Create Company
    const companyResult = await db.query(
      'INSERT INTO companies (name, industry, subscription_plan) VALUES ($1, $2, $3) RETURNING id',
      [company_name, industry || 'Other', 'free']
    );
    const companyId = companyResult.rows[0].id;

    // 2. Create Admin User
    const userResult = await db.query(
      'INSERT INTO users (company_id, full_name, username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, company_id, full_name, username, email, role',
      [companyId, full_name, username, email, passwordHash, 'admin', true]
    );

    await db.query('COMMIT');

    const user = userResult.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Company and Admin User created successfully',
      user: {
        id: user.id,
        company_id: user.company_id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const result = await db.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        company_id: user.company_id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.company_id, u.full_name, u.username, u.email, u.role, u.is_active, u.created_at, 
              c.name as company_name, c.subscription_plan 
       FROM users u 
       JOIN companies c ON u.company_id = c.id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get current user
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all users' });
    }

    const result = await db.query(
      'SELECT id, full_name, username, email, role, is_active, created_at FROM users WHERE company_id = $1 ORDER BY created_at DESC',
      [req.user.company_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    const { userId } = req.params;

    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete and return deleted user for logging, ensuring they belong to the same company
    const result = await db.query('DELETE FROM users WHERE id = $1 AND company_id = $2 RETURNING *', [userId, req.user.company_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      const deletedUser = result.rows[0];
      const userIdLogger = req.user?.id || null;
      const userName = req.user?.full_name || 'Unknown User';
      await logActivity(
        userIdLogger,
        'user_deleted',
        'user',
        deletedUser.id,
        deletedUser.full_name || deletedUser.username || 'User',
        null,
        `${userName} deleted user: ${deletedUser.full_name || deletedUser.username}`
      );
    } catch (e) {
      console.error('Error logging user deletion:', e.message);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update user (admin only)
router.put('/users/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update users' });
    }

    const { userId } = req.params;
    const { full_name, email, role, password } = req.body;

    // Prevent updating self as non-admin
    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // Validate role
    const validRoles = ['admin', 'editor', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email already exists for another user
    if (email) {
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2 AND company_id = $3',
        [email, userId, req.user.company_id]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    let updateQuery = 'UPDATE users SET ';
    const values = [];
    let paramCount = 1;

    if (full_name) {
      updateQuery += `full_name = $${paramCount}, `;
      values.push(full_name);
      paramCount++;
    }

    if (email) {
      updateQuery += `email = $${paramCount}, `;
      values.push(email);
      paramCount++;
    }

    if (role) {
      updateQuery += `role = $${paramCount}, `;
      values.push(role);
      paramCount++;
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += `password_hash = $${paramCount}, `;
      values.push(passwordHash);
      paramCount++;
    }

    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramCount} AND company_id = $${paramCount + 1} RETURNING id, full_name, username, email, role`;
    values.push(userId, req.user.company_id);

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
