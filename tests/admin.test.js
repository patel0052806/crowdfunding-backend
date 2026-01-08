require('dotenv').config({ path: __dirname + '/../.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDb = require('../utils/db');
const app = require('../server');
const User = require('../models/user-model');
const Campaign = require('../models/campaign-model');

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await mongoose.connection.close();
});

const createAdminAndToken = async () => {
  const admin = new User({ username: 'adminuser', email: `admin-${Date.now()}@example.com`, phone: '1234567890', password: 'password', isAdmin: true });
  await admin.save();
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');
  return { admin, token };
};

describe('Admin campaign updates', () => {
  afterEach(async () => {
    await Campaign.deleteMany({ title: /^AdminTest/ });
    await User.deleteMany({ username: { $in: ['adminuser'] } });
  });

  test('rejects lowering goal below current raised', async () => {
    const { token } = await createAdminAndToken();
    const campaign = new Campaign({ title: 'AdminTest', goal: 5000, raised: 4000, creator: new mongoose.Types.ObjectId() });
    await campaign.save();

    const res = await request(app)
      .put(`/api/admin/campaigns/update/${campaign._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ goal: 3500 });

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/Raised cannot exceed goal/i);
  }, 10000);
});