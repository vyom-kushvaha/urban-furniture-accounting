const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  createPurchaseOrder,
  getVendorBills,
  getVendorBillById,
} = require('../controllers/purchaseController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route: /api/purchase-orders
router.route('/purchase-orders')
  .get(authenticateToken, getPurchaseOrders)
  .post(authenticateToken, createPurchaseOrder);

// Route: /api/vendor-bills/:id
router.route('/vendor-bills/:id')
  .get(authenticateToken, getVendorBillById);

// Route: /api/vendor-bills
router.route('/vendor-bills')
  .get(authenticateToken, getVendorBills);

module.exports = router;
