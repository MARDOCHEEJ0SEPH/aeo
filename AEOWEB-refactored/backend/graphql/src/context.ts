import { Request } from 'express';
import jwt from 'jsonwebtoken';
import DataLoader from 'dataloader';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import { RedisPubSub } from 'graphql-redis-subscriptions';

// Database clients
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://aeoweb:password@localhost:5432/aeoweb',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const mongoClient = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/aeoweb'
);

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const pubsub = new RedisPubSub({
  publisher: new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
  subscriber: new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
});

// User interface
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

// Context interface
export interface GraphQLContext {
  user: User | null;
  pgPool: Pool;
  mongo: MongoClient;
  redis: Redis;
  pubsub: RedisPubSub;
  dataloaders: {
    userById: DataLoader<string, any>;
    contentById: DataLoader<string, any>;
    aeoScoresByContentId: DataLoader<string, any[]>;
    citationsByContentId: DataLoader<string, any[]>;
  };
}

// Verify JWT token
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(
      token.replace('Bearer ', ''),
      process.env.JWT_SECRET || 'super-secret-key-change-in-production'
    ) as any;

    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

// Create DataLoaders to prevent N+1 queries
export function createDataLoaders(pgPool: Pool, mongo: MongoClient) {
  // User by ID loader
  const userById = new DataLoader(async (ids: readonly string[]) => {
    const { rows } = await pgPool.query(
      'SELECT * FROM users WHERE id = ANY($1::uuid[])',
      [ids]
    );

    const userMap = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => userMap.get(id) || null);
  });

  // Content by ID loader
  const contentById = new DataLoader(async (ids: readonly string[]) => {
    const { rows } = await pgPool.query(
      'SELECT * FROM content WHERE id = ANY($1::uuid[])',
      [ids]
    );

    const contentMap = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => contentMap.get(id) || null);
  });

  // AEO Scores by Content ID loader
  const aeoScoresByContentId = new DataLoader(async (contentIds: readonly string[]) => {
    const { rows } = await pgPool.query(
      'SELECT * FROM aeo_scores WHERE content_id = ANY($1::uuid[]) ORDER BY calculated_at DESC',
      [contentIds]
    );

    const scoresMap = new Map<string, any[]>();
    rows.forEach((row) => {
      if (!scoresMap.has(row.content_id)) {
        scoresMap.set(row.content_id, []);
      }
      scoresMap.get(row.content_id)!.push(row);
    });

    return contentIds.map((id) => scoresMap.get(id) || []);
  });

  // Citations by Content ID loader
  const citationsByContentId = new DataLoader(async (contentIds: readonly string[]) => {
    const { rows } = await pgPool.query(
      'SELECT * FROM citations WHERE content_id = ANY($1::uuid[]) ORDER BY created_at DESC',
      [contentIds]
    );

    const citationsMap = new Map<string, any[]>();
    rows.forEach((row) => {
      if (!citationsMap.has(row.content_id)) {
        citationsMap.set(row.content_id, []);
      }
      citationsMap.get(row.content_id)!.push(row);
    });

    return contentIds.map((id) => citationsMap.get(id) || []);
  });

  return {
    userById,
    contentById,
    aeoScoresByContentId,
    citationsByContentId,
  };
}

// Create context for each request
export async function createContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const token = req.headers.authorization || '';
  const user = token ? await verifyToken(token) : null;

  return {
    user,
    pgPool,
    mongo: mongoClient,
    redis,
    pubsub,
    dataloaders: createDataLoaders(pgPool, mongoClient),
  };
}

// Initialize database connections
export async function initializeDatabases() {
  try {
    // Test PostgreSQL connection
    await pgPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');

    // Test MongoDB connection
    await mongoClient.connect();
    await mongoClient.db().admin().ping();
    console.log('✅ MongoDB connected');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

// Cleanup database connections
export async function closeDatabases() {
  await pgPool.end();
  await mongoClient.close();
  await redis.quit();
  console.log('🔒 Database connections closed');
}
