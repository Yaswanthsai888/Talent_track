const Bull = require('bull');
const Redis = require('ioredis');
const { logger } = require('../middleware/logger');

class QueueService {
  constructor() {
    this.isRedisAvailable = false;
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      // Create Redis connection
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed, running in fallback mode');
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        }
      });

      this.redis.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          logger.warn('Redis connection failed, running in fallback mode');
          this.isRedisAvailable = false;
        } else {
          logger.error('Redis error:', error);
        }
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isRedisAvailable = true;
        this.initializeQueues();
      });
    } catch (error) {
      logger.warn('Failed to initialize Redis, running in fallback mode:', error);
      this.isRedisAvailable = false;
    }
  }

  initializeQueues() {
    if (!this.isRedisAvailable) return;

    try {
      // Initialize queues
      this.codeExecutionQueue = new Bull('code-execution', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        },
        limiter: {
          max: 5,
          duration: 1000
        }
      });

      this.examProcessingQueue = new Bull('exam-processing', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        },
        limiter: {
          max: 10,
          duration: 1000
        }
      });

      this.setupProcessors();
    } catch (error) {
      logger.error('Failed to initialize queues:', error);
      this.isRedisAvailable = false;
    }
  }

  setupProcessors() {
    if (!this.isRedisAvailable) return;

    // Code execution processor
    this.codeExecutionQueue.process(async (job) => {
      try {
        const { code, language, testCases } = job.data;
        const codeExecutionService = require('./codeExecutionService');
        const result = await codeExecutionService.runTestCases(code, language, testCases);
        return result;
      } catch (error) {
        logger.error('Code execution job failed:', error);
        throw error;
      }
    });

    // Exam processing processor
    this.examProcessingQueue.process(async (job) => {
      try {
        const { examId, userId, answers } = job.data;
        // Process exam answers and calculate scores
        // This is a placeholder - implement actual exam processing logic
        return { success: true, score: 85 };
      } catch (error) {
        logger.error('Exam processing job failed:', error);
        throw error;
      }
    });

    // Error handling
    this.codeExecutionQueue.on('failed', (job, error) => {
      logger.error('Code execution job failed:', {
        jobId: job.id,
        error: error.message
      });
    });

    this.examProcessingQueue.on('failed', (job, error) => {
      logger.error('Exam processing job failed:', {
        jobId: job.id,
        error: error.message
      });
    });
  }

  async addCodeExecutionJob(data) {
    if (!this.isRedisAvailable) {
      // Fallback: Execute code directly
      const codeExecutionService = require('./codeExecutionService');
      return await codeExecutionService.runTestCases(data.code, data.language, data.testCases);
    }

    return this.codeExecutionQueue.add('execute-code', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true
    });
  }

  async addExamProcessingJob(data) {
    if (!this.isRedisAvailable) {
      // Fallback: Process exam directly
      return { success: true, score: 85 }; // Placeholder
    }

    return this.examProcessingQueue.add('process-exam', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true
    });
  }

  async getJobStatus(jobId, queueName) {
    if (!this.isRedisAvailable) {
      return null;
    }

    const queue = queueName === 'code-execution' ? 
      this.codeExecutionQueue : this.examProcessingQueue;
    
    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const progress = job._progress;
    const result = job.returnvalue;

    return {
      id: job.id,
      state,
      progress,
      result
    };
  }

  async cleanup() {
    if (this.isRedisAvailable) {
      await this.codeExecutionQueue?.close();
      await this.examProcessingQueue?.close();
      await this.redis?.quit();
    }
  }
}

module.exports = new QueueService(); 