import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AIPlatform } from '../optimizer.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Request validation schema
const GenerateRequestSchema = z.object({
  topic: z.string().min(3),
  contentType: z.string().default('article'),
  platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']),
  tone: z.string().optional().default('professional'),
  length: z.string().optional().default('medium'),
  keywords: z.array(z.string()).optional().default([]),
  targetAudience: z.string().optional(),
});

export async function generateRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  /**
   * POST /generate
   * Generate AEO-optimized content using AI
   */
  fastify.post('/', async (request, reply) => {
    try {
      const input = GenerateRequestSchema.parse(request.body);

      // Determine word count based on length
      const wordCounts = {
        short: '300-500',
        medium: '600-1000',
        long: '1200-2000',
      };
      const targetLength = wordCounts[input.length as keyof typeof wordCounts] || '600-1000';

      // Build platform-specific instructions
      const platformInstructions = getPlatformInstructions(input.platform);

      // Generate content using AI
      const result = await generateContent(input, targetLength, platformInstructions);

      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  /**
   * POST /generate/outline
   * Generate content outline only
   */
  fastify.post('/outline', async (request, reply) => {
    try {
      const { topic, platform, keywords } = z.object({
        topic: z.string().min(3),
        platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']),
        keywords: z.array(z.string()).optional().default([]),
      }).parse(request.body);

      const keywordText = keywords.length > 0 ? `\nTarget keywords: ${keywords.join(', ')}` : '';
      const platformInstructions = getPlatformInstructions(platform);

      const prompt = `Create a comprehensive content outline for: "${topic}"

Platform: ${platform}${keywordText}

Platform-specific requirements:
${platformInstructions}

Generate a detailed outline with:
1. Main sections (H2 headings)
2. Subsections (H3 headings)
3. Key points to cover in each section
4. Suggested examples or data points

Return the outline as a JSON array of sections with this structure:
[
  {
    "heading": "Section title",
    "level": 2,
    "points": ["Point 1", "Point 2"],
    "subsections": [
      {
        "heading": "Subsection title",
        "level": 3,
        "points": ["Point A", "Point B"]
      }
    ]
  }
]`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AEO content strategist. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const outlineData = JSON.parse(completion.choices[0]?.message?.content || '{"outline": []}');

      return reply.send(outlineData);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  /**
   * POST /generate/ideas
   * Generate content ideas based on topic
   */
  fastify.post('/ideas', async (request, reply) => {
    try {
      const { topic, platform, count } = z.object({
        topic: z.string().min(3),
        platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']),
        count: z.number().min(1).max(20).default(10),
      }).parse(request.body);

      const prompt = `Generate ${count} content ideas optimized for ${platform} related to: "${topic}"

Each idea should:
- Be specific and actionable
- Target questions people actually ask AI assistants
- Be optimized for ${platform} based on its strengths
- Include a suggested content type (article, guide, tutorial, FAQ, etc.)

Return as JSON array with this structure:
[
  {
    "title": "Content title",
    "description": "Brief description",
    "contentType": "article",
    "estimatedLength": "medium",
    "targetKeywords": ["keyword1", "keyword2"]
  }
]`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AEO content strategist. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        response_format: { type: 'json_object' },
      });

      const ideas = JSON.parse(completion.choices[0]?.message?.content || '{"ideas": []}');

      return reply.send(ideas);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });
}

/**
 * Generate full content using AI
 */
async function generateContent(
  input: z.infer<typeof GenerateRequestSchema>,
  targetLength: string,
  platformInstructions: string
) {
  const keywordText = input.keywords.length > 0 ? `\nTarget keywords: ${input.keywords.join(', ')}` : '';
  const audienceText = input.targetAudience ? `\nTarget audience: ${input.targetAudience}` : '';

  const systemPrompt = `You are an expert AEO (Answer Engine Optimization) content writer specializing in creating content optimized for AI search engines.

Your content must:
- Be factual, accurate, and well-researched
- Include specific examples and data
- Use proper HTML structure with semantic headings
- Be optimized for ${input.platform}
- Maintain a ${input.tone} tone
- Be ${targetLength} words

Always include:
- Clear H1 title
- Well-structured H2 and H3 headings
- Bullet points or numbered lists
- Concrete examples
- Data or statistics where relevant
- Proper paragraphs (20-80 words each)`;

  const userPrompt = `Create a ${input.contentType} about: "${input.topic}"

Platform: ${input.platform}
Tone: ${input.tone}
Length: ${targetLength} words${keywordText}${audienceText}

Platform-specific requirements:
${platformInstructions}

Generate the complete content in well-structured HTML format. Include:
1. Title (<h1>)
2. Introduction paragraph
3. Main sections with <h2> headings
4. Subsections with <h3> headings where appropriate
5. Bullet points (<ul>/<li>) and numbered lists (<ol>/<li>)
6. Conclusion paragraph
7. Schema.org Article markup

Return a JSON object with:
{
  "title": "The H1 title",
  "body": "Full HTML content",
  "outline": ["Section 1", "Section 2", ...],
  "metadata": {
    "wordCount": 750,
    "estimatedReadTime": "3 min",
    "keywords": ["keyword1", "keyword2"]
  }
}`;

  try {
    // Use Claude for CLAUDE platform, GPT-4 for others
    if (input.platform === 'CLAUDE' && process.env.ANTHROPIC_API_KEY) {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userPrompt}`,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      // Try to parse as JSON, fallback to raw content
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Fallback
      }

      return {
        title: input.topic,
        body: content,
        outline: [],
        metadata: {
          wordCount: content.split(/\s+/).length,
          estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200) + ' min',
          keywords: input.keywords,
        },
      };
    } else if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3500,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return result;
    } else {
      throw new Error('No AI API keys configured');
    }
  } catch (error: any) {
    throw new Error('Content generation failed: ' + error.message);
  }
}

/**
 * Get platform-specific content generation instructions
 */
function getPlatformInstructions(platform: AIPlatform): string {
  const instructions: Record<AIPlatform, string> = {
    CHATGPT: `
- Use clear, step-by-step instructions
- Include 3-5 practical examples
- Define all technical terms
- Add a "Quick Summary" section at the top
- Use numbered lists for processes
- Keep paragraphs concise (20-50 words)
- Include code snippets if technical
`,
    CLAUDE: `
- Provide comprehensive, in-depth analysis (800+ words)
- Include historical context and background
- Present multiple perspectives and nuances
- Use longer paragraphs for detailed explanations
- Discuss limitations and edge cases
- Include references to related concepts
- Maintain a thoughtful, analytical tone
`,
    PERPLEXITY: `
- Cite specific sources and statistics
- Include publication dates for data
- Use footnote-style citations [1], [2]
- Add 5-10 data points or statistics
- Reference recent studies or reports
- Include a "Sources" section at the end
- Use exact numbers rather than approximations
`,
    GEMINI: `
- Use conversational, friendly tone
- Ask rhetorical questions to engage readers
- Include local/regional context where relevant
- Suggest visual elements (images, charts, videos)
- Use "you" and "your" frequently
- Add "People also ask" style FAQs
- Include practical, actionable tips
`,
    BING: `
- Keep content concise and focused (300-1200 words)
- Add a clear summary/TL;DR at the top
- Include "Last Updated: [current date]"
- Use authoritative, professional tone
- Cite well-known brands or experts
- Optimize for featured snippets
- Include meta description and title suggestions
`,
  };

  return instructions[platform] || '';
}
