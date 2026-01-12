require("dotenv").config({ path: "../.env" });
const connectDb = require("../utils/db");
const Campaign = require("../models/campaign-model");
const User = require("../models/user-model");

const cleanupOrphanedCampaigns = async () => {
  try {
    await connectDb();

    const allUserIds = (await User.find().select("_id")).map(user => user._id.toString());

    const allCampaigns = await Campaign.find().select("creator");

    const orphanedCampaigns = allCampaigns.filter(
      (campaign) => campaign.creator && !allUserIds.includes(campaign.creator.toString())
    );

    if (orphanedCampaigns.length === 0) {
      console.log("No orphaned campaigns found.");
      return;
    }

    const orphanedCampaignIds = orphanedCampaigns.map((campaign) => campaign._id);

    const deleteResult = await Campaign.deleteMany({
      _id: { $in: orphanedCampaignIds },
    });

    console.log(`Successfully deleted ${deleteResult.deletedCount} orphaned campaigns.`);
  } catch (error) {
    console.error("Error cleaning up orphaned campaigns:", error);
  } finally {
    process.exit(0);
  }
};

cleanupOrphanedCampaigns();
