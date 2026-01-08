require('dotenv').config({ path: __dirname + '/../.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDb = require('../utils/db');
const app = require('../server');
const User = require('../models/user-model');
const Campaign = require('../models/campaign-model');
const Donation = require('../models/donation-model');

let server;

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await mongoose.connection.close();
});

const createUserAndToken = async () => {
  const user = new User({ username: 'testuser', email: `test-${Date.now()}@example.com`, password: 'password' });
  await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret');
  return { user, token };
};

describe('Donation endpoint', () => {
  afterEach(async () => {
    await Campaign.deleteMany({ title: /^(Overdonate|Concurrent)/ });
    await Donation.deleteMany({});
    await User.deleteMany({ username: 'testuser' });
  });

  test('rejects single over-donation', async () => {
    const { token } = await createUserAndToken();
    const campaign = new Campaign({ title: 'Overdonate', goal: 5000, raised: 0, creator: new mongoose.Types.ObjectId() });
    await campaign.save();

    const res = await request(app)
      .post('/api/donation/donate')
      .set('Authorization', `Bearer ${token}`)
      .send({ campaignId: campaign._id, amount: 6000 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');

    const updated = await Campaign.findById(campaign._id);
    expect(updated.raised).toBe(0);
  }, 10000);

  test('accepts exact fulfill donation', async () => {
    const { token } = await createUserAndToken();
    const campaign = new Campaign({ title: 'ExactFulfill', goal: 5000, raised: 0, creator: new mongoose.Types.ObjectId() });
    await campaign.save();

    const res = await request(app)
      .post('/api/donation/donate')
      .set('Authorization', `Bearer ${token}`)
      .send({ campaignId: campaign._id, amount: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/fulfilled/i);

    const updated = await Campaign.findById(campaign._id);
    expect(updated.raised).toBe(5000);
  }, 10000);

  test('handles concurrent donations correctly', async () => {
    const { token } = await createUserAndToken();
    const campaign = new Campaign({ title: 'Concurrent', goal: 5000, raised: 4900, creator: new mongoose.Types.ObjectId() });
    await campaign.save();

    const req1 = request(app)
      .post('/api/donation/donate')
      .set('Authorization', `Bearer ${token}`)
      .send({ campaignId: campaign._id, amount: 100 });

    const req2 = request(app)
      .post('/api/donation/donate')
      .set('Authorization', `Bearer ${token}`)
      .send({ campaignId: campaign._id, amount: 100 });

    const results = await Promise.all([req1, req2]);

    const final = await Campaign.findById(campaign._id);
    const donations = await Donation.find({ campaign: campaign._id });

    expect(final.raised).toBeLessThanOrEqual(final.goal);
    expect(donations.length).toBe(1);
    expect(donations[0].amount).toBe(100);
  }, 20000);
});