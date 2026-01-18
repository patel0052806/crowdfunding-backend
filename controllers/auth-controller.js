const User = require('../models/user-model');
const sendEmail = require('../utils/sendEmail');

// home page
const home = async (req, res) => {
  try {
    res.status(200).json({ msg: "Welcome to our home page" });
  } catch (error) {
    console.log(error);
  }
};

// register user
const register = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    let userExist = await User.findOne({ email: email });

    if (userExist) {
      return res.status(400).json({ message: "email already exists" });
    }

    const userCreated = await User.create({
      username,
      email,
      phone,
      password,
    });

    res.status(201).json({
      msg: "Registration Successful",
      userId: userCreated._id.toString(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// send otp
const sendOtp = async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        user.otp = otp;
        user.otpExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        await sendEmail({
            email,
            subject: 'OTP for registration',
            html: `<p>Your OTP is ${otp}</p>`
        });

        res.status(200).json({ message: 'OTP sent successfully' });
    }
    catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

// verify otp
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
            message: "Email verified successfully",
            token: await user.generateToken(),
            userId: user._id.toString(),
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// login logic
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExist = await User.findOne({ email });

    if (!userExist) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!userExist.isEmailVerified) {
      return res.status(401).json({ message: "Email not verified", code: "EMAIL_NOT_VERIFIED" });
    }

    // const user = await bcrypt.compare(password, userExist.password);
    const isPasswordValid = await userExist.comparePassword(password);

    if (isPasswordValid) {
      res.status(200).json({
        message: "Login Successful",
        token: await userExist.generateToken(),
        userId: userExist._id.toString(),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password " });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// user logic - to send user data

const user = async (req, res) => {
  try {
    // const userData = await User.find({});
    const userData = req.user;
    console.log(userData);
    return res.status(200).json({  userData });
  } catch (error) {
    console.log(` error from user route ${error}`);
  }
};


module.exports = { home, register, login, user, sendOtp, verifyOtp };