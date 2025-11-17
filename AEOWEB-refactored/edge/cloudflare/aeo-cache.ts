/**
 * Cloudflare Worker - AEO Score Caching
 * Caches AEO scores at the edge for global low-latency access
 */

export interface Env {
  AEO_CACHE: KVNamespace;
  BACKEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Route: GET /score/:contentId/:platform
    if (request.method === 'GET' && url.pathname.startsWith('/score/')) {
      return handleGetScore(url, env, corsHeaders);
    }

    // Route: POST /score
    if (request.method === 'POST' && url.pathname === '/score') {
      return handlePostScore(request, env, ctx, corsHeaders);
    }

    // Route: DELETE /cache/:contentId
    if (request.method === 'DELETE' && url.pathname.startsWith('/cache/')) {
      return handleDeleteCache(url, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Get cached AEO score
 */
async function handleGetScore(
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const parts = url.pathname.split('/');
  const contentId = parts[2];
  const platform = parts[3];

  if (!contentId || !platform) {
    return new Response(JSON.stringify({ error: 'Missing contentId or platform' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `score:${contentId}:${platform}`;

  // Try to get from KV cache
  const cached = await env.AEO_CACHE.get(cacheKey, 'json');

  if (cached) {
    return new Response(JSON.stringify({ ...cached, cached: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    });
  }

  // Cache miss - fetch from backend
  try {
    const backendResponse = await fetch(
      `${env.BACKEND_URL}/api/aeo/score/${contentId}/${platform}`
    );

    if (!backendResponse.ok) {
      return new Response(JSON.stringify({ error: 'Backend error' }), {
        status: backendResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await backendResponse.json();

    // Cache for 1 hour
    await env.AEO_CACHE.put(cacheKey, JSON.stringify(data), {
      expirationTtl: 3600,
    });

    return new Response(JSON.stringify({ ...data, cached: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Calculate and cache new score
 */
async function handlePostScore(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json<any>();

    if (!body.content || !body.platform) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward to backend AEO service
    const backendResponse = await fetch(`${env.BACKEND_URL}/api/aeo/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      return new Response(JSON.stringify({ error: 'Backend error' }), {
        status: backendResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await backendResponse.json();

    // Cache the result if contentId is provided
    if (body.contentId) {
      const cacheKey = `score:${body.contentId}:${body.platform}`;
      ctx.waitUntil(
        env.AEO_CACHE.put(cacheKey, JSON.stringify(data), {
          expirationTtl: 3600, // 1 hour
        })
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Delete cached score
 */
async function handleDeleteCache(
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const parts = url.pathname.split('/');
  const contentId = parts[2];

  if (!contentId) {
    return new Response(JSON.stringify({ error: 'Missing contentId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Delete all platform caches for this content
  const platforms = ['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING'];
  await Promise.all(
    platforms.map((platform) =>
      env.AEO_CACHE.delete(`score:${contentId}:${platform}`)
    )
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
