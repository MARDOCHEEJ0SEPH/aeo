import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { aeoOptimizer, AIPlatform } from '../optimizer.js';
import { pgPool } from '../index.js';

// Request validation schema
const ScoreRequestSchema = z.object({
  content: z.string().min(50),
  platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']),
});

const MultiPlatformScoreSchema = z.object({
  content: z.string().min(50),
});

export async function scoreRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  /**
   * POST /score
   * Get AEO score for content on specific platform
   */
  fastify.post('/', async (request, reply) => {
    try {
      const { content, platform } = ScoreRequestSchema.parse(request.body);

      const score = await aeoOptimizer.calculateScore(content, platform);

      return reply.send({
        platform,
        score: score.overallScore,
        breakdown: {
          structure: score.structureScore,
          quality: score.qualityScore,
          platform: score.platformScore,
          readability: score.readabilityScore,
        },
        improvements: score.improvements,
        grade: getScoreGrade(score.overallScore),
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  /**
   * POST /score/all
   * Get AEO scores across all platforms
   */
  fastify.post('/all', async (request, reply) => {
    try {
      const { content } = MultiPlatformScoreSchema.parse(request.body);

      const platforms: AIPlatform[] = ['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING'];

      const scores = await Promise.all(
        platforms.map(async (platform) => {
          const score = await aeoOptimizer.calculateScore(content, platform);
          return {
            platform,
            score: score.overallScore,
            breakdown: {
              structure: score.structureScore,
              quality: score.qualityScore,
              platform: score.platformScore,
              readability: score.readabilityScore,
            },
            improvements: score.improvements,
            grade: getScoreGrade(score.overallScore),
          };
        })
      );

      // Calculate average score across all platforms
      const avgScore = scores.reduce((acc, s) => acc + s.score, 0) / scores.length;

      // Find best and worst platforms
      const sortedScores = [...scores].sort((a, b) => b.score - a.score);
      const bestPlatform = sortedScores[0];
      const worstPlatform = sortedScores[sortedScores.length - 1];

      return reply.send({
        scores,
        summary: {
          averageScore: Math.round(avgScore * 100) / 100,
          bestPlatform: {
            platform: bestPlatform.platform,
            score: bestPlatform.score,
          },
          worstPlatform: {
            platform: worstPlatform.platform,
            score: worstPlatform.score,
          },
          overallGrade: getScoreGrade(avgScore),
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  /**
   * GET /score/history/:contentId
   * Get score history for a piece of content
   */
  fastify.get('/history/:contentId', async (request, reply) => {
    try {
      const { contentId } = z.object({
        contentId: z.string().uuid(),
      }).parse(request.params);

      const { rows } = await pgPool.query(
        `SELECT
          platform,
          overall_score,
          structure_score,
          quality_score,
          platform_score,
          readability_score,
          improvements,
          calculated_at
         FROM aeo_scores
         WHERE content_id = $1
         ORDER BY calculated_at DESC
         LIMIT 50`,
        [contentId]
      );

      // Group by platform
      const byPlatform: Record<string, any[]> = {};
      rows.forEach((row) => {
        if (!byPlatform[row.platform]) {
          byPlatform[row.platform] = [];
        }
        byPlatform[row.platform].push({
          score: row.overall_score,
          breakdown: {
            structure: row.structure_score,
            quality: row.quality_score,
            platform: row.platform_score,
            readability: row.readability_score,
          },
          improvements: row.improvements,
          timestamp: row.calculated_at,
        });
      });

      // Calculate trends
      const trends = Object.entries(byPlatform).map(([platform, scores]) => {
        const latest = scores[0];
        const previous = scores[1];
        const trend = previous ? latest.score - previous.score : 0;

        return {
          platform,
          currentScore: latest.score,
          previousScore: previous?.score || null,
          trend,
          trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
          history: scores,
        };
      });

      return reply.send({
        contentId,
        trends,
        totalScores: rows.length,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  /**
   * POST /score/compare
   * Compare two pieces of content
   */
  fastify.post('/compare', async (request, reply) => {
    try {
      const { contentA, contentB, platform } = z.object({
        contentA: z.string().min(50),
        contentB: z.string().min(50),
        platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']),
      }).parse(request.body);

      const [scoreA, scoreB] = await Promise.all([
        aeoOptimizer.calculateScore(contentA, platform),
        aeoOptimizer.calculateScore(contentB, platform),
      ]);

      const comparison = {
        platform,
        contentA: {
          score: scoreA.overallScore,
          breakdown: {
            structure: scoreA.structureScore,
            quality: scoreA.qualityScore,
            platform: scoreA.platformScore,
            readability: scoreA.readabilityScore,
          },
          improvements: scoreA.improvements,
        },
        contentB: {
          score: scoreB.overallScore,
          breakdown: {
            structure: scoreB.structureScore,
            quality: scoreB.qualityScore,
            platform: scoreB.platformScore,
            readability: scoreB.readabilityScore,
          },
          improvements: scoreB.improvements,
        },
        winner: scoreA.overallScore > scoreB.overallScore ? 'A' :
                scoreB.overallScore > scoreA.overallScore ? 'B' : 'tie',
        difference: Math.abs(scoreA.overallScore - scoreB.overallScore),
        breakdown: {
          structure: scoreA.structureScore - scoreB.structureScore,
          quality: scoreA.qualityScore - scoreB.qualityScore,
          platform: scoreA.platformScore - scoreB.platformScore,
          readability: scoreA.readabilityScore - scoreB.readabilityScore,
        },
      };

      return reply.send(comparison);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  /**
   * GET /score/leaderboard
   * Get top scoring content across the platform
   */
  fastify.get('/leaderboard', async (request, reply) => {
    try {
      const { platform, limit } = z.object({
        platform: z.enum(['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING']).optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
      }).parse(request.query);

      let query = `
        SELECT DISTINCT ON (c.id)
          c.id,
          c.title,
          c.slug,
          c.content_type,
          u.username as author,
          aeo.platform,
          aeo.overall_score,
          aeo.calculated_at
        FROM content c
        JOIN users u ON c.author_id = u.id
        JOIN aeo_scores aeo ON c.id = aeo.content_id
        WHERE c.status = 'PUBLISHED'
      `;

      const params: any[] = [];
      if (platform) {
        query += ` AND aeo.platform = $1`;
        params.push(platform);
      }

      query += `
        ORDER BY c.id, aeo.calculated_at DESC
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const { rows } = await pgPool.query(query, params);

      // Sort by score
      const leaderboard = rows
        .sort((a, b) => b.overall_score - a.overall_score)
        .map((row, index) => ({
          rank: index + 1,
          id: row.id,
          title: row.title,
          slug: row.slug,
          contentType: row.content_type,
          author: row.author,
          platform: row.platform,
          score: row.overall_score,
          grade: getScoreGrade(row.overall_score),
          lastOptimized: row.calculated_at,
        }));

      return reply.send({
        platform: platform || 'all',
        leaderboard,
        count: leaderboard.length,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });
}

/**
 * Convert numeric score to letter grade
 */
function getScoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D';
  return 'F';
}
