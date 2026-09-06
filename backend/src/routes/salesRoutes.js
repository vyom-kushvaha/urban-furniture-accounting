const express = require('express');
const router = express.Router();
const { createSalesOrder, getSalesOrders, getInvoices, getInvoiceById } = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route: /api/invoices/:id
router.route('/invoices/:id')
  .get(authenticateToken, getInvoiceById);

// Route: /api/sales-orders/invoices or /api/invoices
router.route('/invoices')
  .get(authenticateToken, getInvoices);

// Route: /api/sales-orders/:id
router.route('/invoices/:id')
  .get(authenticateToken, getInvoiceById);

// Route: /api/sales-orders
router.route('/')
  .post(authenticateToken, createSalesOrder)
  .get(authenticateToken, getSalesOrders);

module.exports = router;
