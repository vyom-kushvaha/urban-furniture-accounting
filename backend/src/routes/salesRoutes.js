const express = require('express');
const router = express.Router();
const { createSalesOrder, getSalesOrders, getInvoices } = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route: /api/sales-orders/invoices
router.route('/invoices')
  .get(authenticateToken, getInvoices);

// Route: /api/sales-orders
router.route('/')
  .post(authenticateToken, createSalesOrder)
  .get(authenticateToken, getSalesOrders);

module.exports = router;
