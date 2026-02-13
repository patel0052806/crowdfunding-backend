const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/donation-model');
const Campaign = require('../models/campaign-model');
const Receipt = require('../models/receipt-model');
const User = require('../models/user-model');
const sendEmail = require('../utils/sendEmail');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
const createOrder = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;
        const donorId = req.user._id;

        if (!campaignId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid campaign or amount' });
        }

        // Verify campaign exists
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Check if campaign goal is already fulfilled
        if (campaign.raised >= campaign.goal) {
            return res.status(400).json({ message: 'Campaign goal already fulfilled' });
        }

        // Check if donation would exceed goal
        const remaining = campaign.goal - campaign.raised;
        if (amount > remaining) {
            return res.status(400).json({ message: `You can only donate up to ₹${remaining}` });
        }
        // Create Razorpay order
        const options = {
            amount: amount * 100, // Amount in paise (required, in smallest currency unit)
            currency: 'INR', // required
            receipt: `rcp_${Date.now().toString().slice(-10)}`, // required, max 40 chars
            payment_capture: 1 // Auto capture payment
        };

        console.log('Creating Razorpay order with options:', options);
        const order = await razorpay.orders.create(options);
        console.log('✅ Order created successfully:', {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
            receipt: order.receipt
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('❌ Order creation error:', {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error
        });
        res.status(500).json({ message: 'Failed to create payment order', error: error.message });
    }
};

// Verify Payment & Create Donation
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, campaignId, amount } = req.body;
        const donorId = req.user._id;

        // Verify payment signature
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(orderId + '|' + paymentId);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== signature) {
            return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        }

        // Get campaign details
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Check if goal is already reached
        if (campaign.raised >= campaign.goal) {
            return res.status(400).json({ message: 'Campaign goal already fulfilled' });
        }

        const remaining = campaign.goal - campaign.raised;
        if (amount > remaining) {
            return res.status(400).json({ message: `You can only donate up to ₹${remaining}` });
        }

        // Atomically update campaign raised amount
        const updated = await Campaign.findOneAndUpdate(
            { _id: campaignId, $expr: { $lte: [{ $add: ["$raised", amount] }, "$goal"] } },
            { $inc: { raised: amount } },
            { new: true }
        );

        if (!updated) {
            const latest = await Campaign.findById(campaignId);
            const newRemaining = latest.goal - latest.raised;
            return res.status(400).json({ message: `You can only donate up to ₹${newRemaining}` });
        }

        // Create donation record
        const donation = new Donation({
            amount: amount,
            campaign: campaignId,
            donor: donorId,
            paymentId: paymentId
        });
        await donation.save();

        // Create receipt
        const receipt = new Receipt({
            donationId: donation._id,
            donor: donorId,
            campaign: campaignId,
            campaignTitle: campaign.title,
            amount: amount,
            status: 'success',
            paymentId: paymentId
        });
        await receipt.save();

        // Send receipt email
        try {
            const donor = await User.findById(donorId);
            if (donor && donor.email) {
                const receiptHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #667eea 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                            <h1 style="margin: 0;">✓ Donation Successful!</h1>
                            <p style="margin: 5px 0 0 0; opacity: 0.9;">Thank you for your generous contribution!</p>
                        </div>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                            <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Receipt Details</h2>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Donor Name</p>
                                    <p style="color: #1e293b; margin: 0; font-weight: 600;">${donor.username}</p>
                                </div>
                                <div>
                                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Donation Amount</p>
                                    <p style="color: #3b82f6; margin: 0; font-weight: 600; font-size: 18px;">₹${amount.toFixed(2)}</p>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Campaign</p>
                                    <p style="color: #1e293b; margin: 0; font-weight: 600;">${campaign.title}</p>
                                </div>
                                <div>
                                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Receipt ID</p>
                                    <p style="color: #1e293b; margin: 0; font-family: monospace; font-size: 12px;">${receipt.transactionId}</p>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Payment ID</p>
                                    <p style="color: #1e293b; margin: 0; font-family: monospace; font-size: 11px;">${paymentId}</p>
                                </div>
                                <div>
                                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Date</p>
                                    <p style="color: #1e293b; margin: 0;">${new Date(receipt.donationDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
                            <p style="color: #0369a1; margin: 0; font-size: 14px;">
                                <strong>Your contribution will help make this campaign a success!</strong> You can view all your donations anytime in your account dashboard.
                            </p>
                        </div>

                        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; margin: 0;">
                                If you have any questions, please contact us at pateltofik266@gmail.com
                            </p>
                        </div>
                    </div>
                `;

                await sendEmail({
                    email: donor.email,
                    subject: `Donation Receipt - ${campaign.title}`,
                    html: receiptHtml
                });
                console.log(`✅ Receipt email sent to ${donor.email}`);
            }
        } catch (emailError) {
            console.error('⚠️ Error sending receipt email:', emailError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Donation successful!',
            receiptId: receipt._id,
            donation: {
                amount: donation.amount,
                campaign: campaign.title,
                status: 'success'
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};

module.exports = {
    createOrder,
    verifyPayment
};
