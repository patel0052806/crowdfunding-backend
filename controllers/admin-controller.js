const User = require('../models/user-model');
const Contact = require('../models/contact-model');
const Campaign = require('../models/campaign-model');
const sendEmail = require('../utils/sendEmail');

//get all users logic
const getAllUsers = async(req,res,next) => {
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
const getUserById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({_id : id}, {password:0});
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// user update logic
const updateUserById = async (req, res, next) => {
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
const deleteUserById = async (req, res, next) => {
    try {
        const id = req.params.id;
        await Campaign.deleteMany({ creator: id });
        await User.deleteOne({_id : id});
        return res.status(200).json({ msg: 'User and their campaigns deleted successfully' });
        
    } catch (error) {
        next(error);
    }

};

//get all contacts logic 
const getAllContacts = async(req,res,next) => {
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
const deleteContactById = async (req, res, next) => {
    try {
        const id = req.params.id;
        await Contact.deleteOne({_id : id});
        return res.status(200).json({ msg: 'Contact deleted successfully' });
        
    } catch (error) {
        next(error);
    }

};

const getPendingCampaigns = async (req, res, next) => {
    try {
        const pendingCampaigns = await Campaign.find({ status: 'pending' }).populate('creator', 'username email');
        if (!pendingCampaigns || pendingCampaigns.length === 0) {
            return res.status(200).json([]);
        }
        return res.status(200).json(pendingCampaigns);
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

const updateCampaignStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status provided.' });
        }

        const campaign = await Campaign.findById(id).populate('creator');

        if (!campaign) {
            return res.status(404).json({ msg: 'Campaign not found.' });
        }

        campaign.status = status;
        await campaign.save();

        const user = campaign.creator;

        if (!user) {
            console.warn(`Campaign ${id} has no creator; skipping email sending.`);
            return res.status(200).json({ msg: `Campaign ${status} successfully (no creator to notify).` });
        }

        let subject;
        let message;

        if (status === 'approved') {
            subject = '🎉 Your Campaign has been Approved!';
            message = `
                <html>
                    <body>
                        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                            <h2 style="color: #4CAF50;">Congratulations, ${user.username}!</h2>
                            <p>We are thrilled to inform you that your campaign, <strong>"${campaign.title}"</strong>, has been approved and is now live!</p>
                            <p>Your campaign is now visible to our community, and you can start accepting donations.</p>
                            <p>Thank you for your contribution to our platform. We wish you the best of luck with your fundraising efforts!</p>
                            <br>
                            <p>Best Regards,</p>
                            <p><strong>The Crowdfunding Team</strong></p>
                        </div>
                    </body>
                </html>
            `;
        } else { // rejected
            subject = 'Update on Your Campaign Submission';
            message = `
                <html>
                    <body>
                        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                            <h2 style="color: #f44336;">Regarding Your Campaign: "${campaign.title}"</h2>
                            <p>Hello ${user.username},</p>
                            <p>Thank you for submitting your campaign, <strong>"${campaign.title}"</strong>, to our platform.</p>
                            <p>After careful review, we regret to inform you that your campaign has not been approved at this time. This may be due to a variety of reasons, such as missing information, unclear objectives, or non-compliance with our community guidelines.</p>
                            <p>We encourage you to review your submission and our guidelines, make any necessary adjustments, and resubmit. We are happy to provide further clarification if needed.</p>
                            <p>Thank you for your understanding.</p>
                            <br>
                            <p>Sincerely,</p>
                            <p><strong>The Crowdfunding Team</strong></p>
                        </div>
                    </body>
                </html>
            `;
        }

        console.log(`Sending ${status} email to ${user.email} for campaign ${campaign._id}`);
        let previewUrl;
        try {
            const result = await sendEmail({
                email: user.email,
                subject,
                html: message,
            });
            previewUrl = result && result.previewUrl;
            console.log('Email send result:', previewUrl ? `previewUrl=${previewUrl}` : 'sent (no preview URL)');
        } catch (emailError) {
            console.error(`Email sending failed for ${status} campaign:`, emailError);
            // Don't fail the whole request because of email issues
        }

        const response = { msg: `Campaign ${status} successfully.` };
        if (previewUrl) response.previewUrl = previewUrl;
        res.status(200).json(response);

    } catch (error) {
        console.error('Error updating campaign status:', error);
        next(error);
    }
};

module.exports = { getAllUsers,getAllContacts,deleteUserById, getUserById, updateUserById, deleteContactById, getPendingCampaigns, getCampaignById, updateCampaignById, updateCampaignStatus };