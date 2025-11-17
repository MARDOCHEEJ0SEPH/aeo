/**
 * Neural Core - The AI Brain
 * Central Intelligence System for Autonomous Robotics Website
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { NeuralCoreAEOLLMO } from './core/NeuralCore.js';
import { DecisionEngine } from './engines/DecisionEngine.js';
import { EvolutionOrchestrator } from './orchestration/EvolutionOrchestrator.js';
import { logger } from './utils/logger.js';
import { DatabaseManager } from './database/DatabaseManager.js';
import { RedisManager } from './cache/RedisManager.js';
import { ElasticsearchManager } from './search/ElasticsearchManager.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Global state
let neuralCore;
let decisionEngine;
let evolutionOrchestrator;
let isSystemReady = false;

/**
 * Initialize all systems
 */
async function initializeSystems() {
  try {
    logger.info('🧠 Initializing Neural Core Systems...');

    // Initialize database connections
    logger.info('📊 Connecting to PostgreSQL database...');
    await DatabaseManager.connect();

    // Initialize Redis cache
    logger.info('🔴 Connecting to Redis cache...');
    await RedisManager.connect();

    // Initialize Elasticsearch
    logger.info('🔍 Connecting to Elasticsearch...');
    await ElasticsearchManager.connect();

    // Initialize Neural Core
    logger.info('🤖 Initializing Neural Core AI Brain...');
    neuralCore = new NeuralCoreAEOLLMO();
    await neuralCore.initialize();

    // Initialize Decision Engine
    logger.info('🎯 Initializing Decision Engine...');
    decisionEngine = new DecisionEngine(neuralCore);
    await decisionEngine.initialize();

    // Initialize Evolution Orchestrator
    logger.info('🧬 Initializing Evolution Orchestrator...');
    evolutionOrchestrator = new EvolutionOrchestrator(neuralCore, decisionEngine);
    await evolutionOrchestrator.initialize();

    // Start autonomous evolution cycle
    logger.info('♻️ Starting autonomous evolution cycle...');
    evolutionOrchestrator.startEvolutionCycle();

    isSystemReady = true;
    logger.info('✅ Neural Core is fully operational!');
    logger.info('🚀 Autonomous systems are now active and evolving...');

  } catch (error) {
    logger.error('❌ Failed to initialize Neural Core:', error);
    process.exit(1);
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const health = {
    status: isSystemReady ? 'healthy' : 'initializing',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: DatabaseManager.isConnected(),
      redis: RedisManager.isConnected(),
      elasticsearch: ElasticsearchManager.isConnected(),
      neuralCore: neuralCore?.isReady() || false,
      decisionEngine: decisionEngine?.isReady() || false,
      evolutionOrchestrator: evolutionOrchestrator?.isRunning() || false
    }
  };

  const statusCode = isSystemReady ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Make autonomous decision
 */
app.post('/api/decision/make', async (req, res) => {
  try {
    const { context, data, urgency } = req.body;

    if (!isSystemReady) {
      return res.status(503).json({ error: 'System is still initializing' });
    }

    const decision = await decisionEngine.makeDecision(context, data, urgency);

    res.json({
      success: true,
      decision,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Decision making error:', error);
    res.status(500).json({ error: 'Failed to make decision', details: error.message });
  }
});

/**
 * Get AI optimization recommendations
 */
app.get('/api/aeo/recommendations', async (req, res) => {
  try {
    if (!isSystemReady) {
      return res.status(503).json({ error: 'System is still initializing' });
    }

    const recommendations = await neuralCore.getAEORecommendations();

    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('AEO recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations', details: error.message });
  }
});

/**
 * Get current learning status
 */
app.get('/api/learning/status', async (req, res) => {
  try {
    if (!isSystemReady) {
      return res.status(503).json({ error: 'System is still initializing' });
    }

    const learningStatus = await neuralCore.getLearningStatus();

    res.json({
      success: true,
      learning: learningStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Learning status error:', error);
    res.status(500).json({ error: 'Failed to get learning status', details: error.message });
  }
});

/**
 * Get evolution metrics
 */
app.get('/api/evolution/metrics', async (req, res) => {
  try {
    if (!isSystemReady) {
      return res.status(503).json({ error: 'System is still initializing' });
    }

    const metrics = await evolutionOrchestrator.getMetrics();

    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Evolution metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics', details: error.message });
  }
});

/**
 * Trigger manual evolution cycle (for testing)
 */
app.post('/api/evolution/trigger', async (req, res) => {
  try {
    if (!isSystemReady) {
      return res.status(503).json({ error: 'System is still initializing' });
    }

    logger.info('Manual evolution cycle triggered');
    const result = await evolutionOrchestrator.runEvolutionCycle();

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Manual evolution trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger evolution', details: error.message });
  }
});

/**
 * Get system statistics
 */
app.get('/api/stats', async (req, res) => {
  try {
    if (!isSystemReady) {
      return res.status(503).json({ error: 'System is still initializing' });
    }

    const stats = {
      neural: await neuralCore.getStatistics(),
      decisions: await decisionEngine.getStatistics(),
      evolution: await evolutionOrchestrator.getStatistics(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Stats retrieval error:', error);
    res.status(500).json({ error: 'Failed to get statistics', details: error.message });
  }
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Neural Core - AI Brain',
    version: '1.0.0',
    description: 'Central Intelligence System for Autonomous Robotics Website',
    status: isSystemReady ? 'operational' : 'initializing',
    capabilities: [
      'Autonomous Decision Making',
      'AEO/LLMO Optimization',
      'Self-Learning & Evolution',
      'Pattern Recognition',
      'Predictive Modeling',
      'Goal Achievement Tracking'
    ],
    endpoints: {
      health: 'GET /health',
      makeDecision: 'POST /api/decision/make',
      aeoRecommendations: 'GET /api/aeo/recommendations',
      learningStatus: 'GET /api/learning/status',
      evolutionMetrics: 'GET /api/evolution/metrics',
      triggerEvolution: 'POST /api/evolution/trigger',
      statistics: 'GET /api/stats'
    }
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  if (evolutionOrchestrator) {
    await evolutionOrchestrator.stop();
  }

  await DatabaseManager.disconnect();
  await RedisManager.disconnect();
  await ElasticsearchManager.disconnect();

  logger.info('Shutdown complete');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');

  if (evolutionOrchestrator) {
    await evolutionOrchestrator.stop();
  }

  await DatabaseManager.disconnect();
  await RedisManager.disconnect();
  await ElasticsearchManager.disconnect();

  logger.info('Shutdown complete');
  process.exit(0);
});

/**
 * Start the server
 */
app.listen(PORT, async () => {
  logger.info(`🧠 Neural Core server starting on port ${PORT}...`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🤖 AI Decision Mode: ${process.env.AI_DECISION_MODE}`);
  logger.info(`📚 Learning Enabled: ${process.env.LEARNING_ENABLED}`);
  logger.info(`⚡ Evolution Speed: ${process.env.EVOLUTION_SPEED}`);

  // Initialize all systems
  await initializeSystems();
});

export default app;
