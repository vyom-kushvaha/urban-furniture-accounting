const express = require('express');
const router = express.Router();
const { createSalesOrder, getSalesOrders, getInvoices, getInvoiceById } = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route: /api/sales-orders
router.route('/sales-orders')
  .post(authenticateToken, createSalesOrder)
  .get(authenticateToken, getSalesOrders);

// Route: /api/invoices/:id
router.route('/invoices/:id')
  .get(authenticateToken, getInvoiceById);

// Route: /api/invoices
router.route('/invoices')
  .get(authenticateToken, getInvoices);

module.exports = router;

