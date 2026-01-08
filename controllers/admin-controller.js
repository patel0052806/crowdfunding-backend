const User = require('../models/user-model');
const Contact = require('../models/contact-model');
const Campaign = require('../models/campaign-model');

//get all users logic
const getAllUsers = async(req,res) => {
    try {
        const users = await User.find({},{password:0});
        console.log(users);
        if (!users || users.length === 0) {
            return res.status(404).json({ msg: 'No users found' });
        }
       return res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

//get user by id
const getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({_id : id}, {password:0});
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// user update logic
const updateUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedUserData = req.body;
        await User.updateOne({_id : id}, {
            $set: updatedUserData,
        });
        return res.status(200).json({ msg: 'User updated successfully' });
    } catch (error) {
        next(error);
    }
};

// user deletion logic
const deleteUserById = async (req, res) => {
    try {
        const id = req.params.id;
        await User.deleteOne({_id : id});
        return res.status(200).json({ msg: 'User deleted successfully' });
        
    } catch (error) {
        next(error);
    }

};   

//get all contacts logic 
const getAllContacts = async(req,res) => {
    try {
        const contacts = await Contact.find({});
        console.log(contacts);
        if (!contacts || contacts.length === 0) {
            return res.status(404).json({ msg: 'No contact found' });
        }
         return res.status(200).json(contacts);
    } catch (error) {
        next(error);
    }
};



// contact deletion logic
const deleteContactById = async (req, res) => {
    try {
        const id = req.params.id;
        await Contact.deleteOne({_id : id});
        return res.status(200).json({ msg: 'Contact deleted successfully' });
        
    } catch (error) {
        next(error);
    }

};

const getPendingCampaigns = async (req, res) => {
    try {
        const pendingCampaigns = await Campaign.find({ status: 'pending' });
        if (!pendingCampaigns || pendingCampaigns.length === 0) {
            return res.status(200).json([]);
        }
        return res.status(200).json(pendingCampaigns);
    } catch (error) {
        next(error);
    }
};

const approveCampaign = async (req, res) => {
    try {
        const id = req.params.id;
        await Campaign.updateOne({ _id: id }, { $set: { status: 'approved' } });
        return res.status(200).json({ msg: 'Campaign approved successfully' });
    } catch (error) {
        next(error);
    }
};

const rejectCampaign = async (req, res) => {
    try {
        const id = req.params.id;
        await Campaign.deleteOne({ _id: id });
        return res.status(200).json({ msg: 'Campaign rejected and deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const getCampaignById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ msg: "Campaign not found" });
        }
        return res.status(200).json(campaign);
    } catch (error) {
        next(error);
    }
};

const updateCampaignById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updatedCampaignData = req.body;

        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ msg: "Campaign not found" });
        }

        const newRaised = typeof updatedCampaignData.raised !== 'undefined' ? Number(updatedCampaignData.raised) : campaign.raised;
        const newGoal = typeof updatedCampaignData.goal !== 'undefined' ? Number(updatedCampaignData.goal) : campaign.goal;

        if (newRaised > newGoal) {
            return res.status(400).json({ msg: 'Raised cannot exceed goal' });
        }

        if (typeof updatedCampaignData.goal !== 'undefined' && Number(updatedCampaignData.goal) < campaign.raised) {
            return res.status(400).json({ msg: 'Goal cannot be lower than current raised amount' });
        }

        const updatedCampaign = await Campaign.findByIdAndUpdate(id, updatedCampaignData, { new: true, runValidators: true });
        return res.status(200).json({ msg: "Campaign updated successfully", campaign: updatedCampaign });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllUsers,getAllContacts,deleteUserById, getUserById, updateUserById, deleteContactById, getPendingCampaigns, approveCampaign, rejectCampaign, getCampaignById, updateCampaignById };