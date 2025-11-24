const Donation = require('../models/donation-model');
const Campaign = require('../models/campaign-model');

const donate = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;
        const donorId = req.user._id; // Assuming you have user authentication middleware

        // Create a new donation
        const donation = new Donation({
            amount,
            campaign: campaignId,
            donor: donorId
        });

        await donation.save();

        // Update the campaign's raised amount
        await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { raised: amount }
        });

        res.status(201).json({ message: 'Donation successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDonations = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const donations = await Donation.find({ campaign: campaignId }).populate('donor', 'username email');
        res.status(200).json(donations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    donate,
    getDonations
};