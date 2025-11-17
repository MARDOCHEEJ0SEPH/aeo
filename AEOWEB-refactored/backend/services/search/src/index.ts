import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Client } from '@elastic/elasticsearch';
import Redis from 'ioredis';
import { z } from 'zod';

const fastify = Fastify({ logger: true });

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

await fastify.register(cors, { origin: true });

// Health check
fastify.get('/health', async () => {
  const health = await esClient.cluster.health();
  return { status: 'healthy', elasticsearch: health.status };
});

// Initialize index
async function initializeIndex() {
  const indexExists = await esClient.indices.exists({ index: 'content' });

  if (!indexExists) {
    await esClient.indices.create({
      index: 'content',
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { type: 'text', analyzer: 'english' },
            body: { type: 'text', analyzer: 'english' },
            contentType: { type: 'keyword' },
            status: { type: 'keyword' },
            tags: { type: 'keyword' },
            authorId: { type: 'keyword' },
            createdAt: { type: 'date' },
            publishedAt: { type: 'date' },
          },
        },
      },
    });
  }
}

await initializeIndex();

// Index content
const IndexSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  contentType: z.string(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  authorId: z.string().optional(),
});

fastify.post('/index', async (req, reply) => {
  try {
    const data = IndexSchema.parse(req.body);

    await esClient.index({
      index: 'content',
      id: data.id,
      document: {
        ...data,
        createdAt: new Date().toISOString(),
      },
    });

    // Invalidate search cache
    await redis.del('search:*');

    return { success: true, id: data.id };
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
});

// Search
const SearchSchema = z.object({
  query: z.string(),
  filters: z.object({
    contentType: z.string().optional(),
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  from: z.number().optional(),
  size: z.number().optional(),
});

fastify.post('/search', async (req) => {
  const data = SearchSchema.parse(req.body);

  // Check cache
  const cacheKey = `search:${JSON.stringify(data)}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // Build Elasticsearch query
  const must: any[] = [
    {
      multi_match: {
        query: data.query,
        fields: ['title^3', 'body'],
        fuzziness: 'AUTO',
      },
    },
  ];

  const filter: any[] = [];

  if (data.filters?.contentType) {
    filter.push({ term: { contentType: data.filters.contentType } });
  }

  if (data.filters?.status) {
    filter.push({ term: { status: data.filters.status } });
  }

  if (data.filters?.tags) {
    filter.push({ terms: { tags: data.filters.tags } });
  }

  const result = await esClient.search({
    index: 'content',
    from: data.from || 0,
    size: data.size || 20,
    body: {
      query: {
        bool: {
          must,
          filter: filter.length > 0 ? filter : undefined,
        },
      },
      highlight: {
        fields: {
          title: {},
          body: {},
        },
      },
    },
  });

  const response = {
    total: (result.hits.total as any).value,
    hits: result.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
      highlight: hit.highlight,
    })),
  };

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(response));

  return response;
});

// Autocomplete
fastify.get('/autocomplete', async (req) => {
  const { query } = req.query as any;

  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  const result = await esClient.search({
    index: 'content',
    size: 10,
    body: {
      query: {
        bool: {
          should: [
            {
              match_phrase_prefix: {
                title: {
                  query,
                  slop: 3,
                },
              },
            },
            {
              match: {
                title: {
                  query,
                  fuzziness: 'AUTO',
                },
              },
            },
          ],
        },
      },
      _source: ['title', 'id'],
    },
  });

  return {
    suggestions: result.hits.hits.map((hit: any) => ({
      id: hit._id,
      title: hit._source.title,
    })),
  };
});

// Delete from index
fastify.delete('/index/:id', async (req) => {
  const { id } = req.params as any;

  await esClient.delete({
    index: 'content',
    id,
  });

  return { success: true };
});

// Bulk index
fastify.post('/index/bulk', async (req, reply) => {
  const { documents } = req.body as any;

  if (!Array.isArray(documents)) {
    return reply.code(400).send({ error: 'documents must be an array' });
  }

  const body = documents.flatMap((doc) => [
    { index: { _index: 'content', _id: doc.id } },
    doc,
  ]);

  const result = await esClient.bulk({ body });

  return {
    success: !result.errors,
    indexed: documents.length,
    errors: result.errors ? result.items.filter((item: any) => item.index?.error) : [],
  };
});

await fastify.listen({ port: parseInt(process.env.PORT || '8084'), host: '0.0.0.0' });
console.log('✅ Search Service running on port 8084');
