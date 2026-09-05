const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route: /api/dashboard
router.get('/', authenticateToken, getDashboardMetrics);

module.exports = router;
