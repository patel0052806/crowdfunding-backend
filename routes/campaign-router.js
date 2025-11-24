const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaign-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const adminMiddleware = require("../middlewares/admin-middleware");

router.get("/admin/campaigns/pending", authMiddleware, adminMiddleware, campaignController.getPendingCampaigns);
router.put("/admin/campaigns/approve/:id", authMiddleware, adminMiddleware, campaignController.approveCampaign);
router.delete("\/admin\/campaigns\/reject\/:id", authMiddleware, adminMiddleware, campaignController.rejectCampaign);

router.get("/campaigns", campaignController.campaigns);
router.post("/campaigns", authMiddleware, adminMiddleware, campaignController.addCampaign);
router.delete("/campaigns/:id", authMiddleware, adminMiddleware, campaignController.deleteCampaign);
router.get("/campaigns/:id", campaignController.getCampaignById);
router.put("/campaigns/:id", authMiddleware, adminMiddleware, campaignController.updateCampaign);
router.post("/apply", authMiddleware, campaignController.applyForCampaign);

module.exports = router;