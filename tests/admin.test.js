require('dotenv').config({ path: __dirname + '/../.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDb = require('../utils/db');
const app = require('../server');
const User = require('../models/user-model');
const Campaign = require('../models/campaign-model');

// mock the email util so we don't actually send emails during tests
jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve({ previewUrl: 'test-url' })));
const sendEmail = require('../utils/sendEmail');

beforeAll(async () => {
  await connectDb();
});

beforeEach(async () => {
  // clean users and campaigns so tests run in isolation
  await Campaign.deleteMany({});
  await User.deleteMany({});
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
    // extra cleanup if needed but collections are reset in beforeEach
    await Campaign.deleteMany({ title: /^AdminTest/ });
    sendEmail.mockClear();
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

  test('sends creator and announcement emails when campaign is approved', async () => {
    const { admin, token } = await createAdminAndToken();

    // create two normal users including campaign creator and another user
    const creator = new User({ username: 'creator', email: `creator-${Date.now()}@example.com`, phone: '1111111111', password: 'password' });
    const follower = new User({ username: 'follower', email: `follower-${Date.now()}@example.com`, phone: '2222222222', password: 'password' });
    await creator.save();
    await follower.save();

    const campaign = new Campaign({ title: 'AdminTestApproval', goal: 1000, creator: creator._id });
    await campaign.save();

    const res = await request(app)
      .put(`/api/admin/campaigns/${campaign._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    // one email to creator, one announcement to follower -> two calls
    // there should be one email to creator plus announcements to admin & follower (total 3)
    expect(sendEmail).toHaveBeenCalledTimes(3);
    // first call subject should mention approval (contains "Your Campaign has been Approved")
    expect(sendEmail.mock.calls[0][0].subject).toMatch(/Your Campaign has been Approved/i);
    // subsequent calls should be announcement emails
    expect(sendEmail.mock.calls[1][0].subject).toMatch(/New Campaign Launched/i);
    expect(sendEmail.mock.calls[2][0].subject).toMatch(/New Campaign Launched/i);
  }, 20000);

  test('admin add route sends announcement to all users', async () => {
    const { token } = await createAdminAndToken();

    // create some users
    const u1 = new User({ username: 'user1', email: `user1-${Date.now()}@example.com`, phone: '1010101010', password: 'pass' });
    const u2 = new User({ username: 'user2', email: `user2-${Date.now()}@example.com`, phone: '2020202020', password: 'pass' });
    await u1.save();
    await u2.save();

    const campaignData = { title: 'AdminTestAdd', description: 'desc', goal: 500 };
    const res = await request(app)
      .post('/api/data/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send(campaignData);

    expect(res.status).toBe(201);

    // should have sent announcement emails to admin,u1,u2 (three calls)
    expect(sendEmail).toHaveBeenCalledTimes(3);
    expect(sendEmail.mock.calls[0][0].subject).toMatch(/New Campaign Created/i);
  }, 20000);

  test('applying user triggers announcement email for all users', async () => {
    // create two users: applicant and another
    const applicant = new User({ username: 'app', email: `app-${Date.now()}@example.com`, phone: '3333333333', password: 'pwd' });
    const other = new User({ username: 'other', email: `other-${Date.now()}@example.com`, phone: '4444444444', password: 'pwd' });
    await applicant.save();
    await other.save();

    // login as applicant (generate token manually)
    const token = jwt.sign({ id: applicant._id }, process.env.JWT_SECRET || 'testsecret');

    const campaignData = { title: 'UserApplyTest', description: 'desc', goal: 750 };
    const res = await request(app)
      .post('/api/data/apply')
      .set('Authorization', `Bearer ${token}`)
      .send(campaignData);

    expect(res.status).toBe(201);

    // announcement should be sent to both users
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[0][0].subject).toMatch(/New Campaign Submitted/i);
  }, 20000);

  test('campaign report returns correct counts', async () => {
    const { token } = await createAdminAndToken();
    // insert sample statuses
    await Campaign.insertMany([
      { title: 'Report1', status: 'approved' },
      { title: 'Report2', status: 'approved' },
      { title: 'Report3', status: 'rejected' },
      { title: 'Report4', status: 'pending' },
    ]);

    const res = await request(app)
      .get('/api/admin/campaigns/report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 4,
      approved: 2,
      rejected: 1,
      pending: 1,
    });
  }, 10000);
});