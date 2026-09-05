const express = require('express');
const router = express.Router();
const { registerPayment } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, registerPayment);

module.exports = router;
