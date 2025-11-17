import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import { pgPool, redis } from '../index.js';

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ResetPasswordSchema = z.object({
  email: z.string().email(),
});

const ConfirmResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).max(128),
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/register
   * Register new user
   */
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, username, password } = RegisterSchema.parse(request.body);

      // Check if user exists
      const existing = await pgPool.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existing.rows.length > 0) {
        return reply.code(409).send({
          error: 'User with this email or username already exists',
        });
      }

      // Hash password
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });

      // Create user
      const result = await pgPool.query(
        `INSERT INTO users (email, username, password_hash, role, email_verified)
         VALUES ($1, $2, $3, 'VIEWER', false)
         RETURNING id, email, username, role, created_at`,
        [email, username, passwordHash]
      );

      const user = result.rows[0];

      // Generate email verification token
      const verificationToken = nanoid(32);
      await redis.setex(
        `email_verification:${verificationToken}`,
        86400, // 24 hours
        user.id
      );

      // Generate tokens
      const accessToken = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      const refreshToken = nanoid(64);

      // Store refresh token
      await pgPool.query(
        `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
        [
          user.id,
          refreshToken,
          request.ip,
          request.headers['user-agent'] || 'unknown',
        ]
      );

      return reply.code(201).send({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          emailVerified: false,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
        verificationToken, // In production, send via email
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Registration failed' });
    }
  });

  /**
   * POST /auth/login
   * Login user
   */
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = LoginSchema.parse(request.body);

      // Get user
      const result = await pgPool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const valid = await argon2.verify(user.password_hash, password);

      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      const refreshToken = nanoid(64);

      // Store refresh token
      await pgPool.query(
        `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
        [
          user.id,
          refreshToken,
          request.ip,
          request.headers['user-agent'] || 'unknown',
        ]
      );

      // Store session in Redis for quick access
      await redis.setex(
        `session:${refreshToken}`,
        604800, // 7 days
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role,
        })
      );

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          emailVerified: user.email_verified,
        },
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  /**
   * POST /auth/logout
   * Logout user (invalidate refresh token)
   */
  fastify.post('/logout', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { refreshToken } = request.body as any;

      if (refreshToken) {
        // Delete from database
        await pgPool.query('DELETE FROM sessions WHERE refresh_token = $1', [
          refreshToken,
        ]);

        // Delete from Redis
        await redis.del(`session:${refreshToken}`);
      }

      return reply.send({ success: true });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * POST /auth/verify-email
   * Verify user email
   */
  fastify.post('/verify-email', async (request, reply) => {
    try {
      const { token } = request.body as any;

      const userId = await redis.get(`email_verification:${token}`);

      if (!userId) {
        return reply.code(400).send({ error: 'Invalid or expired token' });
      }

      // Update user
      await pgPool.query(
        'UPDATE users SET email_verified = true WHERE id = $1',
        [userId]
      );

      // Delete verification token
      await redis.del(`email_verification:${token}`);

      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Email verification failed' });
    }
  });

  /**
   * POST /auth/reset-password
   * Request password reset
   */
  fastify.post('/reset-password', async (request, reply) => {
    try {
      const { email } = ResetPasswordSchema.parse(request.body);

      // Check if user exists
      const result = await pgPool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      // Always return success to prevent email enumeration
      if (result.rows.length === 0) {
        return reply.send({
          success: true,
          message: 'If the email exists, a reset link will be sent',
        });
      }

      const userId = result.rows[0].id;

      // Generate reset token
      const resetToken = nanoid(32);
      await redis.setex(
        `password_reset:${resetToken}`,
        3600, // 1 hour
        userId
      );

      // In production, send email with reset link
      // await sendPasswordResetEmail(email, resetToken);

      return reply.send({
        success: true,
        message: 'If the email exists, a reset link will be sent',
        resetToken, // Only for development - remove in production
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Password reset request failed' });
    }
  });

  /**
   * POST /auth/reset-password/confirm
   * Confirm password reset
   */
  fastify.post('/reset-password/confirm', async (request, reply) => {
    try {
      const { token, newPassword } = ConfirmResetSchema.parse(request.body);

      const userId = await redis.get(`password_reset:${token}`);

      if (!userId) {
        return reply.code(400).send({ error: 'Invalid or expired token' });
      }

      // Hash new password
      const passwordHash = await argon2.hash(newPassword);

      // Update password
      await pgPool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );

      // Delete reset token
      await redis.del(`password_reset:${token}`);

      // Invalidate all sessions for this user
      await pgPool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Password reset failed' });
    }
  });

  /**
   * GET /auth/me
   * Get current user
   */
  fastify.get('/me', async (request, reply) => {
    try {
      await request.jwtVerify();

      const user = request.user as any;

      const result = await pgPool.query(
        'SELECT id, email, username, role, email_verified, created_at FROM users WHERE id = $1',
        [user.id]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({ user: result.rows[0] });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
