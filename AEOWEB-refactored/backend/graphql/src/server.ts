import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { createContext } from './context.js';
import { createDataLoaders } from './dataloaders.js';

// Redis PubSub for distributed GraphQL subscriptions
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
});

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Express app
const app = express();
const httpServer = http.createServer(app);

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      // Authentication for WebSocket
      const token = ctx.connectionParams?.authorization;
      const user = token ? await verifyToken(token) : null;

      return {
        user,
        pubsub,
        dataSources: createDataLoaders(),
      };
    },
    onConnect: async (ctx) => {
      console.log('GraphQL WebSocket client connected');
    },
    onDisconnect: async (ctx) => {
      console.log('GraphQL WebSocket client disconnected');
    },
  },
  wsServer
);

// Apollo Server
const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  formatError: (formattedError, error) => {
    // Custom error formatting
    console.error('GraphQL Error:', error);
    return {
      ...formattedError,
      extensions: {
        ...formattedError.extensions,
        timestamp: new Date().toISOString(),
      },
    };
  },
});

await server.start();

// Middleware
app.use(
  '/graphql',
  cors<cors.CorsRequest>({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = token ? await verifyToken(token) : null;

      return createContext({
        user,
        pubsub,
        dataSources: createDataLoaders(),
      });
    },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'graphql',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '4001');
httpServer.listen(PORT, () => {
  console.log(`
    🚀 GraphQL Server ready
    🔗 HTTP: http://localhost:${PORT}/graphql
    🔌 WebSocket: ws://localhost:${PORT}/graphql
    🏥 Health: http://localhost:${PORT}/health
  `);
});

// Token verification (implement based on your auth strategy)
async function verifyToken(token: string): Promise<any> {
  // Implement JWT verification
  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // return decoded;
    return null;
  } catch (err) {
    return null;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.stop();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
