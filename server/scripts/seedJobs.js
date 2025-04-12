const mongoose = require('mongoose');
const dotenv = require('dotenv');
const JobPosting = require('../models/JobPosting');
const Admin = require('../models/Admin');

// Load environment variables
dotenv.config({ path: '../.env' });

// Sample job postings data
const jobPostingsData = [
  {
    title: 'Senior Software Engineer',
    company: 'TechInnovate Solutions',
    location: 'San Francisco, CA',
    employmentType: 'Full-Time',
    overview: 'We are seeking a talented Senior Software Engineer to join our cutting-edge development team.',
    responsibilities: [
      'Design and implement scalable software solutions',
      'Collaborate with cross-functional teams',
      'Mentor junior developers',
      'Contribute to architectural decisions'
    ],
    requiredSkills: [
      'JavaScript',
      'React',
      'Node.js',
      'MongoDB',
      'Docker'
    ],
    educationLevel: 'Bachelor\'s',
    minExperience: 5,
    salaryRange: {
      min: 120000,
      max: 180000,
      currency: 'USD'
    },
    benefits: [
      'Comprehensive health insurance',
      '401(k) matching',
      'Flexible work hours',
      'Remote work options'
    ],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    applicationInstructions: 'Please submit your resume and portfolio to careers@techinnovate.com',
    department: 'Engineering',
    industryType: 'Technology'
  },
  {
    title: 'Data Scientist',
    company: 'DataDrive Analytics',
    location: 'New York, NY',
    employmentType: 'Full-Time',
    overview: 'Join our data science team to transform complex data into actionable insights.',
    responsibilities: [
      'Develop machine learning models',
      'Perform statistical analysis',
      'Create data visualization dashboards',
      'Collaborate with business stakeholders'
    ],
    requiredSkills: [
      'Python',
      'Machine Learning',
      'SQL',
      'Pandas',
      'TensorFlow'
    ],
    educationLevel: 'Master\'s',
    minExperience: 3,
    salaryRange: {
      min: 110000,
      max: 160000,
      currency: 'USD'
    },
    benefits: [
      'Health and dental insurance',
      'Continuous learning budget',
      'Annual conference sponsorship',
      'Quarterly performance bonuses'
    ],
    applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    applicationInstructions: 'Submit your resume and a brief portfolio to careers@datadrive.com',
    department: 'Data Science',
    industryType: 'Analytics'
  },
  {
    title: 'UX/UI Designer',
    company: 'CreativeMinds Studio',
    location: 'Los Angeles, CA',
    employmentType: 'Remote',
    overview: 'We are looking for a creative UX/UI Designer to craft intuitive and beautiful digital experiences.',
    responsibilities: [
      'Create user-centered design solutions',
      'Develop wireframes and interactive prototypes',
      'Conduct user research and usability testing',
      'Collaborate with product and engineering teams'
    ],
    requiredSkills: [
      'Figma',
      'Adobe XD',
      'User Research',
      'Interaction Design',
      'Prototyping'
    ],
    educationLevel: 'Bachelor\'s',
    minExperience: 2,
    salaryRange: {
      min: 80000,
      max: 120000,
      currency: 'USD'
    },
    benefits: [
      'Fully remote work',
      'Creative tools budget',
      'Health insurance',
      'Flexible working hours'
    ],
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
    applicationInstructions: 'Send your portfolio and resume to design@creativeminds.com',
    department: 'Design',
    industryType: 'Creative'
  }
];

// Seed function
async function seedJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');

    // Find an admin to associate jobs with
    const admin = await Admin.findOne();
    if (!admin) {
      console.error('No admin found. Please create an admin first.');
      process.exit(1);
    }

    // Add createdBy to each job
    const jobsWithCreator = jobPostingsData.map(job => ({
      ...job,
      createdBy: admin._id
    }));

    // Clear existing job postings
    await JobPosting.deleteMany({});

    // Insert new job postings
    const insertedJobs = await JobPosting.insertMany(jobsWithCreator);
    console.log(`${insertedJobs.length} job postings seeded successfully`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

// Run the seeding script
seedJobs();
