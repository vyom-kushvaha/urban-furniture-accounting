const express = require('express');
const router = express.Router();
const {
  getProfitAndLossReport,
  getBalanceSheetReport,
  getBudgetReport,
} = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route: /api/reports/profit-loss
router.get('/profit-loss', authenticateToken, getProfitAndLossReport);

// Route: /api/reports/balance-sheet
router.get('/balance-sheet', authenticateToken, getBalanceSheetReport);

// Route: /api/reports/budget
router.get('/budget', authenticateToken, getBudgetReport);

module.exports = router;
