const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  createPurchaseOrder,
  getVendorBills,
} = require('../controllers/purchaseController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route: /api/purchase-orders
router.route('/purchase-orders')
  .get(authenticateToken, getPurchaseOrders)
  .post(authenticateToken, createPurchaseOrder);

// Route: /api/vendor-bills
router.route('/vendor-bills')
  .get(authenticateToken, getVendorBills);

module.exports = router;
