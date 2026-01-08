require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Campaign = require('./models/campaign-model');
const Donation = require('./models/donation-model');
const { donate } = require('./controllers/donation-controller');
const connectDb = require('./utils/db');

// Connect to the database
connectDb();

const makeReq = (campaignId, amount) => ({
  body: { campaignId, amount },
  user: { _id: new mongoose.Types.ObjectId() },
});

const makeRes = () => {
  let result = { statusCode: null, body: null };
  return {
    status: (code) => {
      result.statusCode = code;
      return {
        json: (data) => {
          result.body = data;
          // Print for visibility
          console.log(`Response status=${code} body=${JSON.stringify(data)}`);
        },
      };
    },
    _get: () => result,
  };
};

const testOverDonation = async () => {
  console.log('\n=== Test: Over-donation single request ===');
  const campaign = new Campaign({ title: 'Overdonate', goal: 5000, raised: 0, creator: new mongoose.Types.ObjectId() });
  await campaign.save();

  const req = makeReq(campaign._id, 6000);
  const res = makeRes();
  await donate(req, res);

  const updated = await Campaign.findById(campaign._id);
  console.log('Campaign after attempt:', { raised: updated.raised, goal: updated.goal });
  console.log('Expected: raised should not exceed goal (0)');

  await Campaign.findByIdAndDelete(campaign._id);
  await Donation.deleteMany({ campaign: campaign._id });
};

const testConcurrent = async () => {
  console.log('\n=== Test: Concurrent donations that together exceed remaining ===');
  const campaign = new Campaign({ title: 'Concurrent', goal: 5000, raised: 4900, creator: new mongoose.Types.ObjectId() });
  await campaign.save();

  // Two concurrent donations of 100 (only one should succeed)
  const req1 = makeReq(campaign._id, 100);
  const req2 = makeReq(campaign._id, 100);
  const res1 = makeRes();
  const res2 = makeRes();

  await Promise.all([donate(req1, res1), donate(req2, res2)]);

  const final = await Campaign.findById(campaign._id);
  const donations = await Donation.find({ campaign: campaign._id });
  console.log('Final campaign:', { raised: final.raised, goal: final.goal });
  console.log('Donation count:', donations.length);
  console.log('Donation amounts:', donations.map(d => d.amount));

  if (final.raised > final.goal) {
    console.error('Test failed: raised exceeds goal');
  } else if (donations.length > 1) {
    console.error('Test failed: more than one donation recorded and may have overshoot');
  } else {
    console.log('Test passed: concurrency handled correctly');
  }

  await Campaign.findByIdAndDelete(campaign._id);
  await Donation.deleteMany({ campaign: campaign._id });
};

const runAll = async () => {
  await testOverDonation();
  await testConcurrent();
  mongoose.connection.close();
};

runAll();
