import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { z } from 'zod';

const fastify = Fastify({ logger: true });

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aeoweb:password@localhost:5432/aeoweb',
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const analyticsQueue = new Queue('analytics', { connection: redis });

await fastify.register(cors, { origin: true });

// Health check
fastify.get('/health', async () => ({ status: 'healthy' }));

// Track event
const TrackEventSchema = z.object({
  eventType: z.string(),
  userId: z.string().optional(),
  properties: z.record(z.any()).optional(),
});

fastify.post('/track', async (req) => {
  const data = TrackEventSchema.parse(req.body);

  // Store in database
  await pgPool.query(
    'INSERT INTO analytics_events (event_type, user_id, properties) VALUES ($1, $2, $3)',
    [data.eventType, data.userId || null, data.properties || {}]
  );

  // Update counters in Redis
  await redis.incr(`events:${data.eventType}:count`);
  await redis.incr(`events:total:count`);

  // Queue for aggregation
  await analyticsQueue.add('aggregate', { eventType: data.eventType });

  return { success: true };
});

// Get metrics
fastify.get('/metrics', async (req) => {
  const { from, to } = req.query as any;

  const result = await pgPool.query(
    `SELECT event_type, COUNT(*) as count
     FROM analytics_events
     WHERE created_at >= COALESCE($1::timestamp, NOW() - INTERVAL '24 hours')
       AND created_at <= COALESCE($2::timestamp, NOW())
     GROUP BY event_type
     ORDER BY count DESC`,
    [from, to]
  );

  const totalEvents = await redis.get('events:total:count');

  return {
    events: result.rows,
    totalEvents: parseInt(totalEvents || '0'),
  };
});

// Real-time metrics
fastify.get('/metrics/real-time', async () => {
  const [activeUsers, requestsPerMinute, avgResponseTime] = await Promise.all([
    redis.get('metrics:active_users'),
    redis.get('metrics:rpm'),
    redis.get('metrics:response_time'),
  ]);

  return {
    timestamp: new Date().toISOString(),
    activeUsers: parseInt(activeUsers || '0'),
    requestsPerMinute: parseInt(requestsPerMinute || '0'),
    avgResponseTime: parseInt(avgResponseTime || '0'),
  };
});

// Dashboard overview
fastify.get('/dashboard/overview', async (req) => {
  const userId = (req as any).user?.id;

  const [totalContent, publishedContent, avgScore, citations] = await Promise.all([
    pgPool.query('SELECT COUNT(*) FROM content WHERE author_id = $1', [userId || 'system']),
    pgPool.query('SELECT COUNT(*) FROM content WHERE author_id = $1 AND status = \'PUBLISHED\'', [userId || 'system']),
    pgPool.query('SELECT AVG(overall_score) FROM aeo_scores'),
    pgPool.query('SELECT COUNT(*) FROM citations WHERE cited = true'),
  ]);

  return {
    totalContent: parseInt(totalContent.rows[0].count),
    publishedContent: parseInt(publishedContent.rows[0].count),
    avgAEOScore: parseFloat(avgScore.rows[0].avg || '0'),
    totalCitations: parseInt(citations.rows[0].count),
  };
});

// Worker for aggregation
new Worker('analytics', async (job) => {
  const { eventType } = job.data;

  // Aggregate to metrics_rollups table
  await pgPool.query(
    `INSERT INTO metrics_rollups (metric_name, time_bucket, interval, value, count)
     VALUES ($1, date_trunc('minute', NOW()), '1min', 1, 1)
     ON CONFLICT (metric_name, time_bucket, interval)
     DO UPDATE SET value = metrics_rollups.value + 1, count = metrics_rollups.count + 1`,
    [`events.${eventType}`]
  );
}, { connection: redis });

await fastify.listen({ port: parseInt(process.env.PORT || '8083'), host: '0.0.0.0' });
console.log('✅ Analytics Service running on port 8083');
