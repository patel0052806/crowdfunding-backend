const Campaign = require('../models/campaign-model');

const campaigns = async (req, res) => {
    try {
        const { search, category } = req.query;
        const query = { status: 'approved' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        const allCampaigns = await Campaign.find(query);
        return res.status(200).json(allCampaigns);
    } catch (error) {
        console.log(`Campaigns error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const addCampaign = async (req, res) => {
    try {
        const { title, description, goal, deadline } = req.body;
        const newCampaign = new Campaign({
            title,
            description,
            goal,
            deadline,
            creator: req.user._id
        });
        await newCampaign.save();
        return res.status(201).json(newCampaign);
    } catch (error) {
        console.log(`Add campaign error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const applyForCampaign = async (req, res) => {
    try {
        const { title, description, goal, deadline } = req.body;
        const newCampaign = new Campaign({
            title,
            description,
            goal,
            deadline,
            creator: req.user._id
            // Status will default to 'pending' based on the schema
        });
        await newCampaign.save();
        return res.status(201).json(newCampaign);
    } catch (error) {
        console.log(`Apply campaign error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        await Campaign.findByIdAndDelete(id);
        return res.status(200).json({ msg: 'Campaign deleted successfully' });
    } catch (error) {
        console.log(`Delete campaign error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};


const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ msg: 'Campaign not found' });
        }

        // Determine resulting values if update applied
        const newRaised = typeof req.body.raised !== 'undefined' ? Number(req.body.raised) : campaign.raised;
        const newGoal = typeof req.body.goal !== 'undefined' ? Number(req.body.goal) : campaign.goal;

        // Prevent setting raised above goal and prevent lowering goal below already-raised amount
        if (newRaised > newGoal) {
            return res.status(400).json({ msg: 'Raised cannot exceed goal' });
        }

        if (typeof req.body.goal !== 'undefined' && Number(req.body.goal) < campaign.raised) {
            return res.status(400).json({ msg: 'Goal cannot be lower than current raised amount' });
        }

        // Apply update with validators
        const updatedCampaign = await Campaign.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        return res.status(200).json(updatedCampaign);
    } catch (error) {
        console.log(`Update campaign error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ msg: 'Campaign not found' });
        }
        return res.status(200).json(campaign);
    } catch (error) {
        console.log(`Get campaign by id error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const getPendingCampaigns = async (req, res) => {
    try {
        const pendingCampaigns = await Campaign.find({ status: 'pending' });
        return res.status(200).json(pendingCampaigns);
    } catch (error) {
        console.log(`Pending campaigns error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const approveCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ msg: 'Campaign not found' });
        }
        campaign.status = 'approved';
        await campaign.save();
        return res.status(200).json({ msg: 'Campaign approved successfully' });
    } catch (error) {
        console.log(`Approve campaign error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const rejectCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        await Campaign.findByIdAndDelete(id);
        return res.status(200).json({ msg: 'Campaign rejected successfully' });
    } catch (error) {
        console.log(`Reject campaign error: ${error}`);
        return res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = { campaigns, addCampaign, applyForCampaign, deleteCampaign, getCampaignById, updateCampaign, getPendingCampaigns, approveCampaign, rejectCampaign };