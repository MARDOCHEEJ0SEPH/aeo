import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { authRoutes } from './routes/auth.js';
import { oauthRoutes } from './routes/oauth.js';
import { webauthnRoutes } from './routes/webauthn.js';
import { tokenRoutes } from './routes/token.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
    },
  },
});

// Database connections
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aeoweb:password@localhost:5432/aeoweb',
  max: 10,
});

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Register plugins
await fastify.register(cors, { origin: true, credentials: true });
await fastify.register(helmet);

// JWT plugin
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
});

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
await fastify.register(authRoutes, { prefix: '/auth' });
await fastify.register(oauthRoutes, { prefix: '/oauth' });
await fastify.register(webauthnRoutes, { prefix: '/webauthn' });
await fastify.register(tokenRoutes, { prefix: '/token' });

// Graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down Auth service...');
  await fastify.close();
  await pgPool.end();
  await redis.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8081');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    fastify.log.info(`
      🔐 Auth Service running on http://${host}:${port}
      📊 Health: http://${host}:${port}/health
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
