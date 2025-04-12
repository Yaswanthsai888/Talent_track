const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkMongoDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Successfully connected to MongoDB');

    // Get the database
    const db = mongoose.connection.db;

    // Check both question collections
    const collections = ['questions', 'Questions'];
    
    for (const collectionName of collections) {
      console.log(`\nChecking ${collectionName} collection:`);
      
      const count = await db.collection(collectionName).countDocuments();
      console.log(`Number of documents: ${count}`);
      
      if (count > 0) {
        const sampleQuestion = await db.collection(collectionName).findOne();
        console.log('\nSample question structure:');
        console.log(JSON.stringify(sampleQuestion, null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the check
checkMongoDB(); 