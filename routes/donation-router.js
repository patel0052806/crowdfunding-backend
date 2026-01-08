const express = require('express');
const router = express.Router();
const { donate, getDonations, getUserReceipts, getReceiptById, getUserDonations, getMyDonations } = require('../controllers/donation-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');

router.post('/donate', authMiddleware, donate);
router.get('/donations/:campaignId', authMiddleware, adminMiddleware, getDonations);
router.get('/my-donations', authMiddleware, getMyDonations);
router.get('/receipts', authMiddleware, getUserReceipts);
router.get('/receipts/:receiptId', authMiddleware, getReceiptById);

module.exports = router;