const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// @desc    Authenticate user & get JWT token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, c.id AS contact_id 
       FROM users u 
       LEFT JOIN contacts c ON c.user_id = u.id 
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      contact_id: user.contact_id || null,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'urban_furniture_secret_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact_id: user.contact_id || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = { loginUser };
