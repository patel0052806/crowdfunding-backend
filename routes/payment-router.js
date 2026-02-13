const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware');
const { createOrder, verifyPayment } = require('../controllers/payment-controller');

// Create Razorpay order
router.post('/create-order', authMiddleware, createOrder);

// Verify payment and create donation
router.post('/verify-payment', authMiddleware, verifyPayment);

module.exports = router;
