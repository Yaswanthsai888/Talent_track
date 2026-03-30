const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function rebuildIndexes() {
    let connection;
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in environment variables');
        }

        console.log('Connecting to MongoDB...');
        connection = await mongoose.connect(process.env.MONGO_URI);
        
        const Job = require(path.join(__dirname, '..', 'models', 'Job'));
        
        console.log('Connected successfully');
        
        // Get existing indexes
        const existingIndexes = await Job.collection.indexes();
        console.log('Existing indexes:', existingIndexes.map(idx => idx.name));

        // Drop all non-_id indexes
        console.log('Dropping existing indexes...');
        await Job.collection.dropIndexes();
        
        // Wait a bit to ensure indexes are dropped
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Creating new indexes...');
        await Job.syncIndexes({ background: true });
        
        console.log('Indexes rebuilt successfully');
        
        // Verify new indexes
        const newIndexes = await Job.collection.indexes();
        console.log('New indexes:', newIndexes.map(idx => idx.name));

    } catch (error) {
        console.error('Error during index rebuild:', error);
        if (error.code === 85) {
            console.log('Index conflict detected. Try dropping indexes manually using MongoDB shell.');
        }
        process.exitCode = 1;
    } finally {
        if (connection) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
        process.exit(process.exitCode || 0);
    }
}

rebuildIndexes().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
