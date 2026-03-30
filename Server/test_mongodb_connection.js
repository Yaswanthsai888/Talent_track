const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDBConnection() {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection URI:', process.env.MONGO_URI);
        
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log('MongoDB connection successful! 🎉');
        
        // Optional: Create a test collection
        const TestSchema = new mongoose.Schema({
            name: String,
            createdAt: { type: Date, default: Date.now }
        });
        const TestModel = mongoose.model('ConnectionTest', TestSchema);
        
        const testDoc = new TestModel({ name: 'Connection Test' });
        await testDoc.save();
        
        console.log('Test document saved successfully.');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

testMongoDBConnection();
