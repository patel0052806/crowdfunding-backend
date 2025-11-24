const express = require('express');
const router = express.Router();
const { donate, getDonations } = require('../controllers/donation-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');

router.post('/donate', authMiddleware, donate);
router.get('/donations/:campaignId', authMiddleware, adminMiddleware, getDonations);

module.exports = router;