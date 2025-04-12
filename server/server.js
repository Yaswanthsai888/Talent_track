const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');
const queueService = require('./services/queueService');
const { logger } = require('./middleware/logger');

// Load environment variables
dotenv.config();

// Set Mongoose options to address deprecation warnings
mongoose.set('strictQuery', false);

// Import the Express app configuration

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('Connected to MongoDB');
})
.catch((error) => {
  logger.error('MongoDB connection error:', error);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('Redis status will be reported once connection attempt completes');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  if (error.code !== 'ECONNREFUSED') {
    process.exit(1);
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  if (error.code !== 'ECONNREFUSED') {
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  
  try {
    // Close server
    await new Promise((resolve) => server.close(resolve));
    
    // Close queues and Redis connection
    await queueService.cleanup();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    
    logger.info('Server shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// No need to export app here as this is the entry point
