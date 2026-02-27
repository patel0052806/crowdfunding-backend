const express = require('express');
const adminController = require('../controllers/admin-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');


const router = express.Router();

router
.route('/users')
.get(authMiddleware,adminMiddleware,adminController.getAllUsers);

// Get single user by id
router
.route("/users/:id")
.get(authMiddleware,adminMiddleware,adminController.getUserById);

// Update user by id
router
.route("/users/update/:id")
.patch(authMiddleware,adminMiddleware,adminController.updateUserById);

// Delete user by id
router
.route("/users/delete/:id")
.delete(authMiddleware,adminMiddleware,adminController.deleteUserById);

router
.route('/contacts')
.get(authMiddleware,adminMiddleware,adminController.getAllContacts);

// Delete contact by id
router
.route("/contacts/delete/:id")
.delete(authMiddleware,adminMiddleware,adminController.deleteContactById);

// Get pending campaigns
router
.route('/campaigns/pending')
.get(authMiddleware, adminMiddleware, adminController.getPendingCampaigns);


// Update Campaign Status (Approve/Reject)
router
.route('/campaigns/:id/status')
.put(authMiddleware, adminMiddleware, adminController.updateCampaignStatus);

// Campaign statistics report
router
.route('/campaigns/report')
.get(authMiddleware, adminMiddleware, adminController.getCampaignReport);

// Get a single campaign by id
router
.route('/campaigns/:id')
.get(authMiddleware, adminMiddleware, adminController.getCampaignById);

// Update a campaign by id
router
.route('/campaigns/update/:id')
.put(authMiddleware, adminMiddleware, adminController.updateCampaignById);

module.exports = router;