/**
 * Seed script to populate the campaigns collection with example documents.
 * Usage: node scripts/seedCampaigns.js
 * Make sure the server's .env contains a valid MONGO_URI and the database is reachable.
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Campaign = require('../models/campaign-model');

const sampleCampaigns = [
  {
    title: 'Community Library Renovation',
    description: 'Help us refurbish and expand the local community library with new books and seating.',
    goal: 2500,
    deadline: new Date('2026-05-01'),
    category: 'Education',
    status: 'approved'
  },
  {
    title: 'Plant 1,000 Trees',
    description: 'An initiative to plant trees along the riverbank to restore the ecosystem.',
    goal: 5000,
    deadline: new Date('2026-06-15'),
    category: 'Environment',
    status: 'approved'
  },
  {
    title: 'Free Coding Workshops',
    description: 'Provide free coding lessons to underprivileged youth in the neighborhood.',
    goal: 3000,
    deadline: new Date('2026-04-20'),
    category: 'Technology',
    status: 'approved'
  },
  {
    title: 'Medical Camp for Seniors',
    description: 'Organize a free health checkup camp for elderly residents.',
    goal: 2000,
    deadline: new Date('2026-05-30'),
    category: 'Healthcare',
    status: 'approved'
  },
  {
    title: 'Arts & Mural Festival',
    description: 'Host a week-long arts festival showcasing local painters and sculptors.',
    goal: 4500,
    deadline: new Date('2026-07-10'),
    category: 'Arts',
    status: 'approved'
  },
  {
    title: 'School Supplies Drive',
    description: 'Collect and distribute school supplies to children in need.',
    goal: 1500,
    deadline: new Date('2026-05-05'),
    category: 'Education',
    status: 'pending'
  },
  {
    title: 'Beach Cleanup Day',
    description: 'Volunteer event to clean up trash along the shoreline.',
    goal: 1200,
    deadline: new Date('2026-04-25'),
    category: 'Environment',
    status: 'pending'
  },
  {
    title: 'Community Garden Tools',
    description: 'Purchase new tools for the neighborhood community garden.',
    goal: 800,
    deadline: new Date('2026-04-10'),
    category: 'Social Cause',
    status: 'pending'
  },
  {
    title: 'Local History Documentary',
    description: 'Produce a short documentary about the town’s history.',
    goal: 3500,
    deadline: new Date('2026-06-01'),
    category: 'Arts',
    status: 'pending'
  },
  {
    title: 'Youth Sports Equipment',
    description: 'Buy new sports equipment for the youth soccer league.',
    goal: 2200,
    deadline: new Date('2026-05-20'),
    category: 'Social Cause',
    status: 'pending'
  }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database, clearing existing campaigns...');
    await Campaign.deleteMany({});
    const docs = await Campaign.insertMany(sampleCampaigns, { ordered: true });
    console.log(`Inserted ${docs.length} sample campaigns`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
