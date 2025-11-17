import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import compress from '@fastify/compress';
import { Server } from 'socket.io';
import Redis from 'ioredis';

// Import routes
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import aeoRoutes from './routes/aeo.js';
import analyticsRoutes from './routes/analytics.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/logger.js';

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
  trustProxy: true,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
});

// Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  optionsSuccessStatus: 204,
});

await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
    },
  },
});

await fastify.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  redis,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded, please try again later',
  }),
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
  sign: {
    expiresIn: '15m',
  },
});

await fastify.register(websocket);
await fastify.register(multipart);
await fastify.register(compress, { global: true });

// Custom middleware
fastify.addHook('onRequest', requestLogger);
fastify.setErrorHandler(errorHandler);

// Health check
fastify.get('/health', async () => ({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  services: {
    redis: redis.status === 'ready',
  },
}));

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(contentRoutes, { prefix: '/api/content' });
await fastify.register(aeoRoutes, { prefix: '/api/aeo' });
await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });

// WebSocket endpoint
fastify.get('/ws', { websocket: true }, (connection, req) => {
  connection.socket.on('message', (message) => {
    // Handle WebSocket messages
    console.log('Received:', message.toString());
    connection.socket.send(JSON.stringify({ type: 'echo', data: message.toString() }));
  });
});

// Socket.io server
const io = new Server(fastify.server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.io connection handling
io.on('connection', async (socket) => {
  fastify.log.info('Client connected:', socket.id);

  // Authentication
  const token = socket.handshake.auth.token;
  try {
    const user = await fastify.jwt.verify(token);
    socket.data.user = user;

    // Join user-specific room
    socket.join(`user:${user.id}`);

    // Subscribe to metrics
    socket.on('subscribe:metrics', (filters) => {
      socket.join(`metrics:${JSON.stringify(filters)}`);

      // Send initial data
      socket.emit('metrics:initial', {
        timestamp: Date.now(),
        data: {},
      });
    });

    socket.on('disconnect', () => {
      fastify.log.info('Client disconnected:', socket.id);
    });
  } catch (err) {
    socket.emit('error', { message: 'Authentication failed' });
    socket.disconnect();
  }
});

// Broadcast metrics update (example)
setInterval(() => {
  io.to('metrics:{}').emit('metrics:update', {
    timestamp: Date.now(),
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    requests: Math.floor(Math.random() * 1000),
  });
}, 5000);

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, starting graceful shutdown`);
    await fastify.close();
    await redis.quit();
    process.exit(0);
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    fastify.log.info(`
      🚀 Gateway server running on http://${host}:${port}
      📊 Health: http://${host}:${port}/health
      🔌 WebSocket: ws://${host}:${port}/ws
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
