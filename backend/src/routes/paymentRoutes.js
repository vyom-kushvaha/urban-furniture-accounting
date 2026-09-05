const express = require('express');
const router = express.Router();
const { registerPayment, getPayments } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.route('/')
  .post(authenticateToken, registerPayment)
  .get(authenticateToken, getPayments);

module.exports = router;
