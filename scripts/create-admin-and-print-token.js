require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDb = require('../utils/db');
const User = require('../models/user-model');

(async () => {
  try {
    await connectDb();
    const admin = new User({ username: 'adminuser', email: `admin-${Date.now()}@example.com`, phone: '1234567890', password: 'password', isAdmin: true });
    await admin.save();
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');
    console.log('ADMIN_TOKEN=' + token);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();