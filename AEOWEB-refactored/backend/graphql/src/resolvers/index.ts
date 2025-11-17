import { GraphQLContext } from '../context.js';
import { GraphQLError } from 'graphql';
import axios from 'axios';

// Helper to require authentication
function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

// Helper to require specific role
function requireRole(context: GraphQLContext, roles: string[]) {
  const user = requireAuth(context);
  if (!roles.includes(user.role)) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

export const resolvers = {
  Query: {
    // Content queries
    content: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return context.dataloaders.contentById.load(id);
    },

    contents: async (
      _: any,
      { filter, pagination }: any,
      context: GraphQLContext
    ) => {
      const limit = pagination?.first || 20;
      const offset = pagination?.after ? parseInt(Buffer.from(pagination.after, 'base64').toString()) : 0;

      let query = 'SELECT * FROM content WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filter?.status) {
        query += ` AND status = $${paramCount++}`;
        params.push(filter.status);
      }

      if (filter?.contentType) {
        query += ` AND content_type = $${paramCount++}`;
        params.push(filter.contentType);
      }

      if (filter?.authorId) {
        query += ` AND author_id = $${paramCount++}`;
        params.push(filter.authorId);
      }

      if (filter?.search) {
        query += ` AND (title ILIKE $${paramCount} OR body ILIKE $${paramCount})`;
        params.push(`%${filter.search}%`);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit + 1, offset);

      const { rows } = await context.pgPool.query(query, params);

      const hasNextPage = rows.length > limit;
      const edges = rows.slice(0, limit).map((node, index) => ({
        cursor: Buffer.from((offset + index).toString()).toString('base64'),
        node,
      }));

      const countResult = await context.pgPool.query('SELECT COUNT(*) FROM content');
      const totalCount = parseInt(countResult.rows[0].count);

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount,
      };
    },

    // AEO queries
    aeoScore: async (
      _: any,
      { contentId, platform }: { contentId: string; platform: string },
      context: GraphQLContext
    ) => {
      const { rows } = await context.pgPool.query(
        'SELECT * FROM aeo_scores WHERE content_id = $1 AND platform = $2 ORDER BY calculated_at DESC LIMIT 1',
        [contentId, platform]
      );

      if (rows.length === 0) {
        throw new GraphQLError('AEO score not found');
      }

      return rows[0];
    },

    aeoPerformance: async (
      _: any,
      { contentId }: { contentId: string },
      context: GraphQLContext
    ) => {
      const citations = await context.dataloaders.citationsByContentId.load(contentId);

      // Group citations by platform
      const platformStats = new Map();
      citations.forEach((citation: any) => {
        if (!platformStats.has(citation.platform)) {
          platformStats.set(citation.platform, {
            citations: 0,
            positions: [],
          });
        }
        const stats = platformStats.get(citation.platform);
        if (citation.cited) {
          stats.citations++;
          if (citation.position) {
            stats.positions.push(citation.position);
          }
        }
      });

      const platforms = Array.from(platformStats.entries()).map(([platform, stats]) => ({
        platform,
        citations: stats.citations,
        avgPosition: stats.positions.length > 0
          ? stats.positions.reduce((a: number, b: number) => a + b, 0) / stats.positions.length
          : 0,
        citationRate: citations.filter((c: any) => c.platform === platform).length > 0
          ? stats.citations / citations.filter((c: any) => c.platform === platform).length
          : 0,
        trend: [], // TODO: Implement trend calculation
      }));

      const totalCitations = citations.filter((c: any) => c.cited).length;
      const citationRate = citations.length > 0 ? totalCitations / citations.length : 0;

      return {
        contentId,
        platforms,
        totalCitations,
        citationRate,
        visibility: citationRate * 100,
      };
    },

    // Analytics queries
    metrics: async (_: any, { filter }: any, context: GraphQLContext) => {
      // Get real-time metrics from Redis
      const cachedMetrics = await context.redis.get('metrics:latest');
      if (cachedMetrics) {
        return JSON.parse(cachedMetrics);
      }

      // Fallback to database
      return {
        timestamp: new Date().toISOString(),
        cpu: 0,
        memory: 0,
        requests: 0,
        errors: 0,
        responseTime: 0,
      };
    },

    citations: async (
      _: any,
      { contentId }: { contentId: string },
      context: GraphQLContext
    ) => {
      return context.dataloaders.citationsByContentId.load(contentId);
    },

    // User queries
    me: async (_: any, __: any, context: GraphQLContext) => {
      const user = requireAuth(context);
      return context.dataloaders.userById.load(user.id);
    },

    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context);
      return context.dataloaders.userById.load(id);
    },
  },

  Mutation: {
    // Content mutations
    createContent: async (_: any, { input }: any, context: GraphQLContext) => {
      const user = requireAuth(context);

      const { rows } = await context.pgPool.query(
        `INSERT INTO content (title, body, content_type, status, author_id, metadata)
         VALUES ($1, $2, $3, 'DRAFT', $4, $5)
         RETURNING *`,
        [input.title, input.body, input.contentType, user.id, input.metadata || {}]
      );

      const content = rows[0];

      // Index in Elasticsearch (via Search Service)
      try {
        await axios.post('http://localhost:8084/index', {
          id: content.id,
          title: content.title,
          body: content.body,
          contentType: content.content_type,
        });
      } catch (error) {
        console.error('Failed to index content:', error);
      }

      // Publish event
      await context.pubsub.publish('CONTENT_UPDATED', {
        contentUpdated: content,
      });

      return content;
    },

    updateContent: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (input.title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(input.title);
      }

      if (input.body !== undefined) {
        updates.push(`body = $${paramCount++}`);
        values.push(input.body);
      }

      if (input.contentType !== undefined) {
        updates.push(`content_type = $${paramCount++}`);
        values.push(input.contentType);
      }

      if (input.metadata !== undefined) {
        updates.push(`metadata = $${paramCount++}`);
        values.push(input.metadata);
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const { rows } = await context.pgPool.query(
        `UPDATE content SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (rows.length === 0) {
        throw new GraphQLError('Content not found');
      }

      const content = rows[0];

      // Publish event
      await context.pubsub.publish('CONTENT_UPDATED', {
        contentUpdated: content,
      });

      return content;
    },

    deleteContent: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const user = requireRole(context, ['ADMIN', 'EDITOR']);

      const result = await context.pgPool.query(
        'DELETE FROM content WHERE id = $1',
        [id]
      );

      return result.rowCount > 0;
    },

    publishContent: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const user = requireAuth(context);

      const { rows } = await context.pgPool.query(
        `UPDATE content SET status = 'PUBLISHED', published_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );

      if (rows.length === 0) {
        throw new GraphQLError('Content not found');
      }

      return rows[0];
    },

    // AEO mutations
    optimizeContent: async (
      _: any,
      { id, platform }: { id: string; platform: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      // Call AEO Service
      try {
        const response = await axios.post(`http://localhost:4002/optimize`, {
          contentId: id,
          platform,
        });

        return response.data;
      } catch (error: any) {
        throw new GraphQLError('AEO optimization failed: ' + error.message);
      }
    },

    generateContent: async (_: any, { input }: any, context: GraphQLContext) => {
      requireAuth(context);

      // Call AEO Service
      try {
        const response = await axios.post(`http://localhost:4002/generate`, input);
        return response.data;
      } catch (error: any) {
        throw new GraphQLError('Content generation failed: ' + error.message);
      }
    },

    // Analytics mutations
    trackEvent: async (_: any, { input }: any, context: GraphQLContext) => {
      await context.pgPool.query(
        `INSERT INTO analytics_events (event_type, user_id, properties)
         VALUES ($1, $2, $3)`,
        [input.eventType, input.userId, input.properties || {}]
      );

      // Update real-time counters in Redis
      await context.redis.incr(`events:${input.eventType}:count`);

      return true;
    },

    trackCitation: async (_: any, { input }: any, context: GraphQLContext) => {
      const { rows } = await context.pgPool.query(
        `INSERT INTO citations (platform, content_id, query, cited, citation_text, position)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [input.platform, input.contentId, input.query, input.cited, input.citationText, input.position]
      );

      // Update citation counters
      if (input.cited) {
        await context.redis.incr(`citations:${input.platform}:${input.contentId}`);
      }

      return rows[0];
    },

    // Auth mutations
    login: async (_: any, { email, password }: any, context: GraphQLContext) => {
      // Forward to Auth Service
      try {
        const response = await axios.post('http://localhost:8081/login', {
          email,
          password,
        });

        return response.data;
      } catch (error: any) {
        throw new GraphQLError('Authentication failed');
      }
    },

    register: async (_: any, { input }: any, context: GraphQLContext) => {
      // Forward to Auth Service
      try {
        const response = await axios.post('http://localhost:8081/register', input);
        return response.data;
      } catch (error: any) {
        throw new GraphQLError('Registration failed: ' + error.message);
      }
    },

    refreshToken: async (_: any, { token }: { token: string }, context: GraphQLContext) => {
      // Forward to Auth Service
      try {
        const response = await axios.post('http://localhost:8081/refresh', { token });
        return response.data;
      } catch (error: any) {
        throw new GraphQLError('Token refresh failed');
      }
    },
  },

  Subscription: {
    metricsUpdate: {
      subscribe: async (_: any, { interval }: { interval: number }, context: GraphQLContext) => {
        return context.pubsub.asyncIterator(['METRICS_UPDATE']);
      },
    },

    contentUpdated: {
      subscribe: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
        return context.pubsub.asyncIterator(['CONTENT_UPDATED']);
      },
      filter: (payload: any, variables: any) => {
        return payload.contentUpdated.id === variables.id;
      },
    },

    aeoAlert: {
      subscribe: async (_: any, __: any, context: GraphQLContext) => {
        requireAuth(context);
        return context.pubsub.asyncIterator(['AEO_ALERT']);
      },
    },
  },

  // Field resolvers
  Content: {
    author: async (parent: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.userById.load(parent.author_id);
    },

    aeoScores: async (parent: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.aeoScoresByContentId.load(parent.id);
    },
  },

  AEOScore: {
    improvements: async (parent: any) => {
      // Parse improvements from JSON
      return parent.improvements || [];
    },
  },
};
