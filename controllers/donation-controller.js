const Donation = require('../models/donation-model');
const Campaign = require('../models/campaign-model');
const Receipt = require('../models/receipt-model');
const mongoose = require('mongoose');

const donate = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;
        const donorId = req.user._id;
        const numericAmount = Number(amount);

        if (!campaignId || !numericAmount || numericAmount <= 0) {
            return res.status(400).json({ message: 'Invalid donation amount or campaign id' });
        }

        // Find campaign and check if donation is allowed
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Check if already fulfilled
        if (campaign.raised >= campaign.goal) {
            return res.status(400).json({ message: 'Campaign goal already fulfilled' });
        }

        // Check if donation would exceed goal
        const remaining = campaign.goal - campaign.raised;
        if (numericAmount > remaining) {
            return res.status(400).json({ message: `You can only donate up to ${remaining}` });
        }

        // Atomically increment raised only if it won't exceed goal
        const updated = await Campaign.findOneAndUpdate(
            { _id: campaignId, $expr: { $lte: [{ $add: ["$raised", numericAmount] }, "$goal"] } },
            { $inc: { raised: numericAmount } },
            { new: true }
        );

        if (!updated) {
            // Race condition: another donation succeeded in between
            const latest = await Campaign.findById(campaignId);
            const newRemaining = latest.goal - latest.raised;
            return res.status(400).json({ message: `You can only donate up to ${newRemaining}` });
        }

        // Save donation record
        const donation = new Donation({
            amount: numericAmount,
            campaign: campaignId,
            donor: donorId
        });
        await donation.save();

        // Create receipt for donation
        const receipt = new Receipt({
            donationId: donation._id,
            donor: donorId,
            campaign: campaignId,
            campaignTitle: campaign.title,
            amount: numericAmount,
            status: 'success'
        });
        await receipt.save();

        // Check if goal just got fulfilled
        if (updated.raised >= updated.goal) {
            return res.status(201).json({ message: 'Donation fulfilled successfully', receiptId: receipt._id });
        }

        return res.status(201).json({ message: 'Donation successful', receiptId: receipt._id });
    } catch (error) {
        console.error('Donation error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getDonations = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const donations = await Donation.find({ campaign: campaignId }).populate('donor', 'username email');
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserReceipts = async (req, res) => {
    try {
        const userId = req.user._id;
        const receipts = await Receipt.find({ donor: userId })
            .populate('campaign', '_id title')
            .sort({ createdAt: -1 });
        res.status(200).json(receipts);
    } catch (error) {
        console.error('❌ Error fetching receipts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getReceiptById = async (req, res) => {
    try {
        const { receiptId } = req.params;
        const receipt = await Receipt.findById(receiptId)
            .populate('donor', 'username email')
            .populate('campaign', 'title description goal deadline');
        
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        res.status(200).json(receipt);
    } catch (error) {
        console.error('Error fetching receipt:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserDonations = async (req, res) => {
    try {
        const userId = req.user._id;
        const receipts = await Receipt.find({ donor: userId })
            .populate('campaign', '_id title')
            .sort({ createdAt: -1 });
        res.status(200).json(receipts);
    } catch (error) {
        console.error('❌ Error fetching donations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    donate,
    getDonations,
    getUserReceipts,
    getReceiptById,
    getUserDonations
};