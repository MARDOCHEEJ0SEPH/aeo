import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { optimizeRoutes } from './routes/optimize.js';
import { generateRoutes } from './routes/generate.js';
import { scoreRoutes } from './routes/score.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Database connections
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aeoweb:password@localhost:5432/aeoweb',
  max: 10,
});

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// BullMQ Queue for background optimization
export const optimizationQueue = new Queue('aeo-optimization', {
  connection: redis,
});

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await fastify.register(helmet);

// Health check
fastify.get('/health', async () => ({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  services: {
    database: (await pgPool.query('SELECT 1')).rowCount === 1,
    redis: (await redis.ping()) === 'PONG',
  },
}));

// Register routes
await fastify.register(optimizeRoutes, { prefix: '/optimize' });
await fastify.register(generateRoutes, { prefix: '/generate' });
await fastify.register(scoreRoutes, { prefix: '/score' });

// Graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down AEO service...');
  await fastify.close();
  await pgPool.end();
  await redis.quit();
  await optimizationQueue.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4002');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    fastify.log.info(`
      🤖 AEO Service running on http://${host}:${port}
      📊 Health: http://${host}:${port}/health
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
