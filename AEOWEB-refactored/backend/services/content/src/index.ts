import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

const fastify = Fastify({ logger: true });

// Database connections
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aeoweb:password@localhost:5432/aeoweb',
});

const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/aeoweb');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// S3 Client for file uploads
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined,
});

// Plugins
await fastify.register(cors, { origin: true });
await fastify.register(multipart);

// Health check
fastify.get('/health', async () => ({ status: 'healthy' }));

// Content CRUD
const CreateContentSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1),
  contentType: z.string(),
  metadata: z.record(z.any()).optional(),
});

fastify.post('/content', async (req, reply) => {
  try {
    const data = CreateContentSchema.parse(req.body);

    const result = await pgPool.query(
      `INSERT INTO content (title, body, content_type, status, author_id, metadata)
       VALUES ($1, $2, $3, 'DRAFT', $4, $5) RETURNING *`,
      [data.title, data.body, data.contentType, (req as any).user?.id || 'system', data.metadata || {}]
    );

    return result.rows[0];
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
});

fastify.get('/content', async (req) => {
  const { status, limit = '20', offset = '0' } = req.query as any;

  let query = 'SELECT * FROM content WHERE 1=1';
  const params: any[] = [];

  if (status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await pgPool.query(query, params);
  return { data: result.rows, count: result.rowCount };
});

fastify.get('/content/:id', async (req, reply) => {
  const { id } = req.params as any;

  // Try cache first
  const cached = await redis.get(`content:${id}`);
  if (cached) return JSON.parse(cached);

  const result = await pgPool.query('SELECT * FROM content WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return reply.code(404).send({ error: 'Not found' });
  }

  const content = result.rows[0];
  await redis.setex(`content:${id}`, 300, JSON.stringify(content));

  return content;
});

fastify.put('/content/:id', async (req, reply) => {
  const { id } = req.params as any;
  const { title, body, contentType, metadata } = req.body as any;

  const result = await pgPool.query(
    `UPDATE content SET title = COALESCE($1, title), body = COALESCE($2, body),
     content_type = COALESCE($3, content_type), metadata = COALESCE($4, metadata),
     updated_at = NOW() WHERE id = $5 RETURNING *`,
    [title, body, contentType, metadata, id]
  );

  if (result.rows.length === 0) {
    return reply.code(404).send({ error: 'Not found' });
  }

  // Invalidate cache
  await redis.del(`content:${id}`);

  return result.rows[0];
});

fastify.delete('/content/:id', async (req, reply) => {
  const { id } = req.params as any;

  const result = await pgPool.query('DELETE FROM content WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    return reply.code(404).send({ error: 'Not found' });
  }

  await redis.del(`content:${id}`);

  return { success: true };
});

// File upload
fastify.post('/content/:id/upload', async (req, reply) => {
  const { id } = req.params as any;
  const data = await req.file();

  if (!data) {
    return reply.code(400).send({ error: 'No file provided' });
  }

  const buffer = await data.toBuffer();
  const key = `content/${id}/${Date.now()}-${data.filename}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET || 'aeoweb-uploads',
    Key: key,
    Body: buffer,
    ContentType: data.mimetype,
  }));

  const url = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: process.env.S3_BUCKET || 'aeoweb-uploads',
    Key: key,
  }), { expiresIn: 3600 });

  return { url, key };
});

// Start server
await mongoClient.connect();
await fastify.listen({ port: parseInt(process.env.PORT || '8082'), host: '0.0.0.0' });
console.log('✅ Content Service running on port 8082');
