const Redis = require('ioredis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    // Cache TTLs in seconds
    this.ttl = {
      questions: 3600, // 1 hour
      exams: 1800, // 30 minutes
      results: 86400, // 24 hours
      userSessions: 7200 // 2 hours
    };
  }

  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, stringValue);
      } else {
        await this.redis.set(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Question caching
  async getQuestion(questionId) {
    return this.get(`question:${questionId}`);
  }

  async setQuestion(questionId, question) {
    return this.set(`question:${questionId}`, question, this.ttl.questions);
  }

  // Exam caching
  async getExam(examId) {
    return this.get(`exam:${examId}`);
  }

  async setExam(examId, exam) {
    return this.set(`exam:${examId}`, exam, this.ttl.exams);
  }

  // Results caching
  async getResults(userId, examId) {
    return this.get(`results:${userId}:${examId}`);
  }

  async setResults(userId, examId, results) {
    return this.set(`results:${userId}:${examId}`, results, this.ttl.results);
  }

  // User session caching
  async getUserSession(userId) {
    return this.get(`session:${userId}`);
  }

  async setUserSession(userId, sessionData) {
    return this.set(`session:${userId}`, sessionData, this.ttl.userSessions);
  }

  // Batch operations
  async mget(keys) {
    try {
      const data = await this.redis.mget(keys);
      return data.map(item => item ? JSON.parse(item) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return [];
    }
  }

  async mset(keyValuePairs, ttl = null) {
    try {
      const pipeline = this.redis.pipeline();
      for (const [key, value] of keyValuePairs) {
        const stringValue = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, stringValue);
        } else {
          pipeline.set(key, stringValue);
        }
      }
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }
}

module.exports = new CacheService(); 