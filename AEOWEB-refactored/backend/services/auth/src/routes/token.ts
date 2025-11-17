import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { pgPool, redis } from '../index.js';

export async function tokenRoutes(fastify: FastifyInstance) {
  /**
   * POST /token/refresh
   * Refresh access token using refresh token
   */
  fastify.post('/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body as any;

      if (!refreshToken) {
        return reply.code(400).send({ error: 'Refresh token required' });
      }

      // Check Redis cache first
      const cachedSession = await redis.get(`session:${refreshToken}`);

      let userId, userEmail, userRole;

      if (cachedSession) {
        // Use cached session
        const session = JSON.parse(cachedSession);
        userId = session.userId;
        userEmail = session.email;
        userRole = session.role;
      } else {
        // Check database
        const sessionResult = await pgPool.query(
          `SELECT s.user_id, u.email, u.username, u.role
           FROM sessions s
           JOIN users u ON s.user_id = u.id
           WHERE s.refresh_token = $1 AND s.expires_at > NOW()`,
          [refreshToken]
        );

        if (sessionResult.rows.length === 0) {
          return reply.code(401).send({ error: 'Invalid or expired refresh token' });
        }

        const session = sessionResult.rows[0];
        userId = session.user_id;
        userEmail = session.email;
        userRole = session.role;

        // Cache session
        await redis.setex(
          `session:${refreshToken}`,
          604800, // 7 days
          JSON.stringify({
            userId,
            email: userEmail,
            role: userRole,
          })
        );
      }

      // Get full user data
      const userResult = await pgPool.query(
        'SELECT id, email, username, role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return reply.code(401).send({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // Generate new access token
      const accessToken = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      return reply.send({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Token refresh failed' });
    }
  });

  /**
   * POST /token/revoke
   * Revoke a refresh token
   */
  fastify.post('/revoke', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      const { refreshToken } = request.body as any;

      if (refreshToken) {
        // Revoke specific token
        await pgPool.query(
          'DELETE FROM sessions WHERE user_id = $1 AND refresh_token = $2',
          [user.id, refreshToken]
        );
        await redis.del(`session:${refreshToken}`);
      } else {
        // Revoke all tokens for user
        const result = await pgPool.query(
          'SELECT refresh_token FROM sessions WHERE user_id = $1',
          [user.id]
        );

        // Delete all sessions
        await pgPool.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);

        // Delete from Redis
        const tokens = result.rows.map((row) => `session:${row.refresh_token}`);
        if (tokens.length > 0) {
          await redis.del(...tokens);
        }
      }

      return reply.send({ success: true });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * GET /token/sessions
   * List active sessions
   */
  fastify.get('/sessions', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      const result = await pgPool.query(
        `SELECT id, created_at, expires_at, ip_address, user_agent
         FROM sessions
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY created_at DESC`,
        [user.id]
      );

      return reply.send({
        sessions: result.rows.map((row) => ({
          id: row.id,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
        })),
      });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * DELETE /token/sessions/:id
   * Revoke a specific session
   */
  fastify.delete('/sessions/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      const { id } = request.params as any;

      // Get refresh token first
      const sessionResult = await pgPool.query(
        'SELECT refresh_token FROM sessions WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (sessionResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      const refreshToken = sessionResult.rows[0].refresh_token;

      // Delete session
      await pgPool.query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [
        id,
        user.id,
      ]);

      // Delete from Redis
      await redis.del(`session:${refreshToken}`);

      return reply.send({ success: true });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * POST /token/verify
   * Verify if access token is valid
   */
  fastify.post('/verify', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      return reply.send({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      return reply.code(401).send({
        valid: false,
        error: 'Invalid token',
      });
    }
  });
}
