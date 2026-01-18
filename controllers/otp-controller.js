
const User = require('../models/user-model');
const sendEmail = require('../utils/sendEmail');

// send otp
const sendOtp = async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        await sendEmail({
            email,
            subject: 'OTP for registration',
            html: `<p>Your OTP is <strong>${otp}</strong></p>`
        });

        res.status(200).json({ message: 'OTP sent successfully', otp });
    }
    catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message // FOR DEBUGGING ONLY
        });
    }
};

module.exports = { sendOtp };
