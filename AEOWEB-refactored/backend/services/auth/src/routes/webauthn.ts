import { FastifyInstance } from 'fastify';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { pgPool, redis } from '../index.js';

const rpName = 'AEOWEB';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

export async function webauthnRoutes(fastify: FastifyInstance) {
  /**
   * POST /webauthn/register/options
   * Generate WebAuthn registration options
   */
  fastify.post('/register/options', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      // Get user from database
      const result = await pgPool.query(
        'SELECT id, email, username FROM users WHERE id = $1',
        [user.id]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const dbUser = result.rows[0];

      // Get existing credentials
      const credentialsResult = await pgPool.query(
        'SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = $1',
        [user.id]
      );

      const existingCredentials = credentialsResult.rows.map((row) => ({
        id: Buffer.from(row.credential_id, 'base64url'),
        transports: row.transports || [],
      }));

      // Generate registration options
      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: dbUser.id,
        userName: dbUser.username,
        userDisplayName: dbUser.username,
        attestationType: 'none',
        excludeCredentials: existingCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      // Store challenge in Redis (expires in 5 minutes)
      await redis.setex(
        `webauthn:challenge:${user.id}`,
        300,
        options.challenge
      );

      return reply.send(options);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate registration options' });
    }
  });

  /**
   * POST /webauthn/register/verify
   * Verify WebAuthn registration
   */
  fastify.post('/register/verify', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      const body = request.body as RegistrationResponseJSON;

      // Get stored challenge
      const expectedChallenge = await redis.get(`webauthn:challenge:${user.id}`);

      if (!expectedChallenge) {
        return reply.code(400).send({ error: 'Challenge expired or not found' });
      }

      // Verify registration
      const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return reply.code(400).send({ error: 'Verification failed' });
      }

      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      // Store credential
      await pgPool.query(
        `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          Buffer.from(credentialID).toString('base64url'),
          Buffer.from(credentialPublicKey).toString('base64'),
          counter,
          body.response.transports || [],
        ]
      );

      // Delete challenge
      await redis.del(`webauthn:challenge:${user.id}`);

      return reply.send({
        verified: true,
        message: 'Credential registered successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to verify registration' });
    }
  });

  /**
   * POST /webauthn/authenticate/options
   * Generate WebAuthn authentication options
   */
  fastify.post('/authenticate/options', async (request, reply) => {
    try {
      const { email } = request.body as any;

      // Get user
      const userResult = await pgPool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        // Return generic error to prevent email enumeration
        return reply.code(400).send({ error: 'Authentication failed' });
      }

      const userId = userResult.rows[0].id;

      // Get user's credentials
      const credentialsResult = await pgPool.query(
        'SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = $1',
        [userId]
      );

      if (credentialsResult.rows.length === 0) {
        return reply.code(400).send({ error: 'No credentials found' });
      }

      const allowCredentials = credentialsResult.rows.map((row) => ({
        id: Buffer.from(row.credential_id, 'base64url'),
        transports: row.transports || [],
      }));

      // Generate authentication options
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials,
        userVerification: 'preferred',
      });

      // Store challenge
      await redis.setex(
        `webauthn:auth_challenge:${email}`,
        300,
        options.challenge
      );

      return reply.send(options);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate authentication options' });
    }
  });

  /**
   * POST /webauthn/authenticate/verify
   * Verify WebAuthn authentication
   */
  fastify.post('/authenticate/verify', async (request, reply) => {
    try {
      const { email, response: authResponse } = request.body as {
        email: string;
        response: AuthenticationResponseJSON;
      };

      // Get stored challenge
      const expectedChallenge = await redis.get(`webauthn:auth_challenge:${email}`);

      if (!expectedChallenge) {
        return reply.code(400).send({ error: 'Challenge expired or not found' });
      }

      // Get user
      const userResult = await pgPool.query(
        'SELECT id, email, username, role FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return reply.code(401).send({ error: 'Authentication failed' });
      }

      const user = userResult.rows[0];

      // Get credential
      const credentialResult = await pgPool.query(
        'SELECT credential_id, public_key, counter, transports FROM webauthn_credentials WHERE credential_id = $1 AND user_id = $2',
        [Buffer.from(authResponse.rawId, 'base64url').toString('base64url'), user.id]
      );

      if (credentialResult.rows.length === 0) {
        return reply.code(401).send({ error: 'Credential not found' });
      }

      const credential = credentialResult.rows[0];

      // Verify authentication
      const verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: Buffer.from(credential.credential_id, 'base64url'),
          credentialPublicKey: Buffer.from(credential.public_key, 'base64'),
          counter: credential.counter,
          transports: credential.transports || [],
        },
      });

      if (!verification.verified) {
        return reply.code(401).send({ error: 'Verification failed' });
      }

      // Update counter
      await pgPool.query(
        'UPDATE webauthn_credentials SET counter = $1 WHERE credential_id = $2',
        [verification.authenticationInfo.newCounter, credential.credential_id]
      );

      // Generate tokens
      const accessToken = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      const refreshToken = require('nanoid').nanoid(64);

      // Store session
      await pgPool.query(
        `INSERT INTO sessions (user_id, refresh_token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, refreshToken]
      );

      // Delete challenge
      await redis.del(`webauthn:auth_challenge:${email}`);

      return reply.send({
        verified: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to verify authentication' });
    }
  });

  /**
   * GET /webauthn/credentials
   * List user's credentials
   */
  fastify.get('/credentials', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      const result = await pgPool.query(
        'SELECT id, credential_id, transports, created_at FROM webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC',
        [user.id]
      );

      return reply.send({
        credentials: result.rows.map((row) => ({
          id: row.id,
          credentialId: row.credential_id,
          transports: row.transports,
          createdAt: row.created_at,
        })),
      });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * DELETE /webauthn/credentials/:id
   * Remove a credential
   */
  fastify.delete('/credentials/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      const { id } = request.params as any;

      const result = await pgPool.query(
        'DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (result.rowCount === 0) {
        return reply.code(404).send({ error: 'Credential not found' });
      }

      return reply.send({ success: true });
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
