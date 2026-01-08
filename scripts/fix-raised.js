require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const connectDb = require('../utils/db');
const Campaign = require('../models/campaign-model');

(async function fixRaised() {
  try {
    await connectDb();
    const overfunded = await Campaign.find({ $expr: { $gt: ["$raised", "$goal"] } });
    console.log(`Found ${overfunded.length} overfunded campaigns`);

    for (const c of overfunded) {
      console.log(`Capping campaign ${c._id} raised=${c.raised} goal=${c.goal}`);
      c.raised = c.goal;
      await c.save();
    }

    console.log('Done.');
    mongoose.connection.close();
  } catch (err) {
    console.error('Fix failed', err);
    mongoose.connection.close();
  }
})();