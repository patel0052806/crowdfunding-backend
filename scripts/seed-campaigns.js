require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const connectDb = require('../utils/db');
const Campaign = require('../models/campaign-model');

const campaigns = [
  {
    title: "Build a Solar School",
    description: "Help us build a school powered entirely by solar energy in rural areas. Education for all with sustainable energy.",
    goal: 50000,
    raised: 32000,
    category: "Education",
    deadline: new Date('2026-06-30'),
    status: "approved"
  },
  {
    title: "Mental Health Awareness App",
    description: "Developing an app to provide mental health support and counseling to underserved communities.",
    goal: 35000,
    raised: 18500,
    category: "Healthcare",
    deadline: new Date('2026-05-15'),
    status: "approved"
  },
  {
    title: "Ocean Cleanup Initiative",
    description: "Deploy advanced robots to clean plastic from our oceans. Join us in protecting marine life.",
    goal: 75000,
    raised: 62000,
    category: "Environment",
    deadline: new Date('2026-07-30'),
    status: "approved"
  },
  {
    title: "AI For Good Research",
    description: "Fund cutting-edge AI research to solve real-world problems in healthcare and education.",
    goal: 100000,
    raised: 45000,
    category: "Technology",
    deadline: new Date('2026-08-30'),
    status: "approved"
  },
  {
    title: "Community Art Gallery",
    description: "Create a public art gallery showcasing local artists and promoting cultural exchange.",
    goal: 25000,
    raised: 20000,
    category: "Arts",
    deadline: new Date('2026-04-15'),
    status: "approved"
  },
  {
    title: "Clean Water for Villages",
    description: "Install water purification systems in 10 villages lacking access to clean drinking water.",
    goal: 40000,
    raised: 38000,
    category: "Social Cause",
    deadline: new Date('2026-03-31'),
    status: "approved"
  },
  {
    title: "Women Entrepreneurship Program",
    description: "Train and fund 100 women entrepreneurs to start their own businesses.",
    goal: 60000,
    raised: 30000,
    category: "Social Cause",
    deadline: new Date('2026-06-30'),
    status: "approved"
  },
  {
    title: "Renewable Energy Lab",
    description: "Build a research laboratory for developing next-generation renewable energy sources.",
    goal: 120000,
    raised: 80000,
    category: "Technology",
    deadline: new Date('2026-09-30'),
    status: "approved"
  },
  {
    title: "Youth Sports Academy",
    description: "Establish a sports academy for underprivileged youth to develop athletic and leadership skills.",
    goal: 45000,
    raised: 15000,
    category: "Education",
    deadline: new Date('2026-07-15'),
    status: "approved"
  },
  {
    title: "Cancer Research Fund",
    description: "Fund research into new cancer treatment methods and personalized medicine.",
    goal: 250000,
    raised: 120000,
    category: "Healthcare",
    deadline: new Date('2026-12-31'),
    status: "approved"
  },
  {
    title: "Organic Farming Initiative",
    description: "Help farmers transition to organic farming with training and resources.",
    goal: 55000,
    raised: 41000,
    category: "Environment",
    deadline: new Date('2026-08-15'),
    status: "approved"
  },
  {
    title: "Digital Literacy Program",
    description: "Teach digital skills to seniors and rural communities to bridge the digital divide.",
    goal: 30000,
    raised: 25000,
    category: "Education",
    deadline: new Date('2026-05-30'),
    status: "approved"
  },
  {
    title: "Wildlife Conservation Project",
    description: "Protect endangered species through habitat restoration and anti-poaching efforts.",
    goal: 80000,
    raised: 55000,
    category: "Environment",
    deadline: new Date('2026-10-31'),
    status: "approved"
  },
  {
    title: "Music School for Underprivileged",
    description: "Provide music education and instruments to talented children from low-income families.",
    goal: 35000,
    raised: 12000,
    category: "Arts",
    deadline: new Date('2026-06-30'),
    status: "approved"
  },
  {
    title: "Smart City Infrastructure",
    description: "Develop IoT-based smart city solutions for efficient urban management.",
    goal: 150000,
    raised: 95000,
    category: "Technology",
    deadline: new Date('2026-11-30'),
    status: "approved"
  },
  {
    title: "Diabetes Prevention Program",
    description: "Launch wellness programs to prevent type 2 diabetes in at-risk populations.",
    goal: 50000,
    raised: 33000,
    category: "Healthcare",
    deadline: new Date('2026-07-31'),
    status: "approved"
  },
  {
    title: "Reforestation Drive",
    description: "Plant 1 million trees across deforested regions to combat climate change.",
    goal: 100000,
    raised: 75000,
    category: "Environment",
    deadline: new Date('2026-09-30'),
    status: "approved"
  },
  {
    title: "Technical Education for Girls",
    description: "Scholarships and training in STEM fields for girls in developing regions.",
    goal: 45000,
    raised: 28000,
    category: "Education",
    deadline: new Date('2026-08-31'),
    status: "approved"
  },
  {
    title: "Affordable Housing Project",
    description: "Build affordable homes for homeless families in urban areas.",
    goal: 200000,
    raised: 110000,
    category: "Social Cause",
    deadline: new Date('2026-12-15'),
    status: "approved"
  },
  {
    title: "Sustainable Fashion Initiative",
    description: "Support designers creating eco-friendly and ethical fashion products.",
    goal: 40000,
    raised: 22000,
    category: "Environment",
    deadline: new Date('2026-07-31'),
    status: "approved"
  }
];

(async function seedCampaigns() {
  try {
    await connectDb();
    
    // Clear existing campaigns
    await Campaign.deleteMany({});
    console.log('Cleared existing campaigns');

    // Insert new campaigns
    const result = await Campaign.insertMany(campaigns);
    console.log(`Successfully inserted ${result.length} campaigns`);
    
    // Show summary
    console.log('\nCampaign Summary:');
    campaigns.forEach((c, i) => {
      console.log(`${i + 1}. ${c.title} | ${c.category} | Goal: $${c.goal} | Raised: $${c.raised}`);
    });

    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding failed', err);
    mongoose.connection.close();
  }
})();