/**
 * Redis Manager
 * Manages Redis cache and pub/sub operations
 */

import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

class RedisManagerClass {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.connected = false;
  }

  /**
   * Connect to Redis
   */
  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Too many Redis reconnection attempts');
              return new Error('Too many retries');
            }
            return retries * 100;
          }
        }
      });

      this.client.on('error', (err) => logger.error('Redis Client Error:', err));
      this.client.on('connect', () => logger.info('Redis client connecting...'));
      this.client.on('ready', () => logger.info('Redis client ready'));

      await this.client.connect();

      // Create separate clients for pub/sub
      this.publisher = this.client.duplicate();
      await this.publisher.connect();

      this.subscriber = this.client.duplicate();
      await this.subscriber.connect();

      this.connected = true;
      logger.info('✅ Redis connected successfully');

      return true;
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Set a value in Redis
   */
  async set(key, value, expirationSeconds = null) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      if (expirationSeconds) {
        await this.client.setEx(key, expirationSeconds, value);
      } else {
        await this.client.set(key, value);
      }

      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      return await this.client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      return await this.client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a value
   */
  async incr(key) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Publish a message
   */
  async publish(channel, message) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.publisher.publish(channel, messageStr);
    } catch (error) {
      logger.error(`Redis PUBLISH error for channel ${channel}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel, callback) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (e) {
          callback(message);
        }
      });

      logger.info(`Subscribed to Redis channel: ${channel}`);
      return true;
    } catch (error) {
      logger.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
      return false;
    }
  }

  /**
   * Get multiple keys matching a pattern
   */
  async keys(pattern) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Set hash field
   */
  async hSet(key, field, value) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      return await this.client.hSet(key, field, value);
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  /**
   * Get hash field
   */
  async hGet(key, field) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async hGetAll(key) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }

      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    try {
      if (this.client) await this.client.quit();
      if (this.publisher) await this.publisher.quit();
      if (this.subscriber) await this.subscriber.quit();

      this.connected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }
}

// Export singleton instance
export const RedisManager = new RedisManagerClass();
export default RedisManager;
