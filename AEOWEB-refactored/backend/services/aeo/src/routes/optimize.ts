import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { aeoOptimizer, AIPlatform } from '../optimizer.js';
import { pgPool, optimizationQueue } from '../index.js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Request validation schema
const OptimizeRequestSchema = z.object({
  contentId: z.string().uuid(),
  platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']),
  aiOptimize: z.boolean().optional().default(false),
});

const DirectOptimizeSchema = z.object({
  content: z.string().min(100),
  platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']),
  aiOptimize: z.boolean().optional().default(false),
});

export async function optimizeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  /**
   * POST /optimize
   * Optimize existing content for AEO
   */
  fastify.post('/', async (request, reply) => {
    try {
      const { contentId, platform, aiOptimize } = OptimizeRequestSchema.parse(request.body);

      // Fetch content from database
      const { rows } = await pgPool.query(
        'SELECT id, title, body FROM content WHERE id = $1',
        [contentId]
      );

      if (rows.length === 0) {
        return reply.code(404).send({ error: 'Content not found' });
      }

      const content = rows[0];

      // Calculate AEO score
      const score = await aeoOptimizer.calculateScore(content.body, platform);

      // Store score in database
      await pgPool.query(
        `INSERT INTO aeo_scores (content_id, platform, overall_score, structure_score, quality_score, platform_score, readability_score, improvements)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          contentId,
          platform,
          score.overallScore,
          score.structureScore,
          score.qualityScore,
          score.platformScore,
          score.readabilityScore,
          JSON.stringify(score.improvements),
        ]
      );

      let optimizedContent = content.body;
      let platformTips: string[] = [];

      // AI-powered optimization if requested
      if (aiOptimize && score.overallScore < 80) {
        const optimizationResult = await optimizeWithAI(
          content.title,
          content.body,
          platform,
          score.improvements
        );
        optimizedContent = optimizationResult.optimizedContent;
        platformTips = optimizationResult.tips;
      }

      return reply.send({
        score: score.overallScore,
        optimizedContent,
        improvements: score.improvements,
        platformTips,
        breakdown: {
          structure: score.structureScore,
          quality: score.qualityScore,
          platform: score.platformScore,
          readability: score.readabilityScore,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  /**
   * POST /optimize/direct
   * Optimize raw content without database storage
   */
  fastify.post('/direct', async (request, reply) => {
    try {
      const { content, platform, aiOptimize } = DirectOptimizeSchema.parse(request.body);

      // Calculate AEO score
      const score = await aeoOptimizer.calculateScore(content, platform);

      let optimizedContent = content;
      let platformTips: string[] = [];

      // AI-powered optimization if requested
      if (aiOptimize && score.overallScore < 80) {
        const optimizationResult = await optimizeWithAI(
          'Content',
          content,
          platform,
          score.improvements
        );
        optimizedContent = optimizationResult.optimizedContent;
        platformTips = optimizationResult.tips;
      }

      return reply.send({
        score: score.overallScore,
        optimizedContent,
        improvements: score.improvements,
        platformTips,
        breakdown: {
          structure: score.structureScore,
          quality: score.qualityScore,
          platform: score.platformScore,
          readability: score.readabilityScore,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  /**
   * POST /optimize/batch
   * Queue batch optimization jobs
   */
  fastify.post('/batch', async (request, reply) => {
    try {
      const { contentIds, platform } = z.object({
        contentIds: z.array(z.string().uuid()),
        platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']),
      }).parse(request.body);

      const jobs = [];
      for (const contentId of contentIds) {
        const job = await optimizationQueue.add('optimize', {
          contentId,
          platform,
        });
        jobs.push(job.id);
      }

      return reply.send({
        message: `Queued ${jobs.length} optimization jobs`,
        jobIds: jobs,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });
}

/**
 * Use AI (GPT-4 or Claude) to optimize content based on improvements
 */
async function optimizeWithAI(
  title: string,
  content: string,
  platform: AIPlatform,
  improvements: any[]
): Promise<{ optimizedContent: string; tips: string[] }> {
  const improvementsList = improvements
    .map((imp) => `- ${imp.category}: ${imp.description}`)
    .join('\n');

  const prompt = `You are an AEO (Answer Engine Optimization) expert specializing in optimizing content for AI platforms.

Platform: ${platform}
Title: ${title}

Current content:
${content}

Identified improvements needed:
${improvementsList}

Please optimize this content to achieve a higher AEO score for ${platform}. Focus on:
1. Implementing all the suggested improvements
2. Maintaining the original message and tone
3. Adding platform-specific optimizations for ${platform}
4. Ensuring readability and clarity

Return ONLY the optimized content in HTML format, without any explanations or markdown formatting.`;

  try {
    let optimizedContent = '';

    // Use Claude for CLAUDE platform, GPT-4 for others
    if (platform === 'CLAUDE' && process.env.ANTHROPIC_API_KEY) {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      optimizedContent = response.content[0].type === 'text' ? response.content[0].text : content;
    } else if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AEO expert. Return only the optimized content in HTML format, without explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      optimizedContent = response.choices[0]?.message?.content || content;
    } else {
      throw new Error('No AI API keys configured');
    }

    // Generate platform-specific tips
    const tips = generatePlatformTips(platform);

    return {
      optimizedContent,
      tips,
    };
  } catch (error: any) {
    console.error('AI optimization error:', error);
    throw new Error('AI optimization failed: ' + error.message);
  }
}

/**
 * Generate platform-specific optimization tips
 */
function generatePlatformTips(platform: AIPlatform): string[] {
  const tips: Record<AIPlatform, string[]> = {
    CHATGPT: [
      'Use clear step-by-step instructions',
      'Include practical examples and use cases',
      'Define technical terms and acronyms',
      'Use bullet points for lists',
      'Add a TL;DR summary at the top',
    ],
    CLAUDE: [
      'Provide comprehensive background context',
      'Include nuanced analysis with multiple perspectives',
      'Use longer, detailed paragraphs (800+ words total)',
      'Add historical context where relevant',
      'Discuss limitations and edge cases',
    ],
    PERPLEXITY: [
      'Cite multiple credible sources',
      'Include recent statistics and data',
      'Add publication dates and timestamps',
      'Link to authoritative references',
      'Use footnotes or inline citations',
    ],
    GEMINI: [
      'Add images, charts, or infographics',
      'Use conversational, friendly tone',
      'Include location-specific information',
      'Add "People also ask" style questions',
      'Embed video content if applicable',
    ],
    BING: [
      'Keep content concise and focused (300-1200 words)',
      'Add a clear summary section',
      'Include "Last Updated" date',
      'Use authoritative references',
      'Optimize meta descriptions and titles',
    ],
  };

  return tips[platform] || [];
}
