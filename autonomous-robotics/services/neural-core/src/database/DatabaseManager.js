/**
 * Database Manager
 * Manages PostgreSQL database connections and operations
 */

import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

class DatabaseManagerClass {
  constructor() {
    this.pool = null;
    this.connected = false;
  }

  /**
   * Connect to the database
   */
  async connect() {
    try {
      const connectionString = process.env.DATABASE_URL ||
        'postgresql://postgres:password@database:5432/robotics_brain';

      this.pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.connected = true;
      logger.info('✅ PostgreSQL connected successfully');

      // Initialize database schema
      await this.initializeSchema();

      return true;
    } catch (error) {
      logger.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    try {
      const client = await this.pool.connect();

      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS learning_history (
          id SERIAL PRIMARY KEY,
          performance JSONB,
          patterns JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS user_behavior_patterns (
          id SERIAL PRIMARY KEY,
          pattern_type VARCHAR(100),
          data JSONB,
          frequency INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS evolution_logs (
          id SERIAL PRIMARY KEY,
          cycle_type VARCHAR(50),
          status VARCHAR(50),
          data JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS decision_logs (
          id SERIAL PRIMARY KEY,
          context VARCHAR(100),
          decision JSONB,
          analysis JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS decision_rules (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE,
          condition TEXT,
          action VARCHAR(100),
          priority INTEGER DEFAULT 1,
          confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS generated_content (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255),
          content TEXT,
          status VARCHAR(50),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ab_tests (
          id VARCHAR(100) PRIMARY KEY,
          hypothesis TEXT,
          variants JSONB,
          duration INTEGER,
          metrics JSONB,
          status VARCHAR(50),
          results JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS evolution_metrics (
          id SERIAL PRIMARY KEY,
          cycle_type VARCHAR(50),
          success BOOLEAN,
          cycle_time INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS analytics_events (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(100),
          event_data JSONB,
          user_id VARCHAR(100),
          session_id VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ai_platform_queries (
          id SERIAL PRIMARY KEY,
          platform VARCHAR(50),
          query TEXT,
          cited BOOLEAN,
          position INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_learning_history_created_at ON learning_history(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_user_behavior_frequency ON user_behavior_patterns(frequency DESC);
        CREATE INDEX IF NOT EXISTS idx_evolution_logs_created_at ON evolution_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_decision_logs_created_at ON decision_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
        CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_ai_platform_queries_platform ON ai_platform_queries(platform);
      `);

      client.release();
      logger.info('✅ Database schema initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize schema:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool
   */
  getClient() {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return this.pool;
  }

  /**
   * Execute a query
   */
  async query(text, params) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return this.pool.query(text, params);
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      logger.info('Database disconnected');
    }
  }
}

// Export singleton instance
export const DatabaseManager = new DatabaseManagerClass();
export default DatabaseManager;
