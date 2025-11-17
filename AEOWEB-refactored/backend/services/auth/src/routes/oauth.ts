import { FastifyInstance } from 'fastify';
import oauthPlugin from '@fastify/oauth2';
import { nanoid } from 'nanoid';
import { pgPool, redis } from '../index.js';

export async function oauthRoutes(fastify: FastifyInstance) {
  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: 'googleOAuth2',
      credentials: {
        client: {
          id: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
        },
        auth: oauthPlugin.GOOGLE_CONFIGURATION,
      },
      startRedirectPath: '/oauth/google',
      callbackUri: `${process.env.APP_URL || 'http://localhost:3000'}/oauth/google/callback`,
      scope: ['email', 'profile'],
    });

    fastify.get('/google/callback', async (request, reply) => {
      try {
        const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

        // Fetch user info from Google
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });

        const googleUser = await response.json() as any;

        // Find or create user
        let user = await findOrCreateOAuthUser('google', googleUser.id, {
          email: googleUser.email,
          username: googleUser.name || googleUser.email.split('@')[0],
          emailVerified: googleUser.verified_email,
        });

        // Generate tokens
        const accessToken = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        });

        const refreshToken = nanoid(64);

        // Store session
        await pgPool.query(
          `INSERT INTO sessions (user_id, refresh_token, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
          [user.id, refreshToken]
        );

        // Redirect to frontend with tokens
        return reply.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }
    });
  }

  // GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: 'githubOAuth2',
      credentials: {
        client: {
          id: process.env.GITHUB_CLIENT_ID,
          secret: process.env.GITHUB_CLIENT_SECRET,
        },
        auth: oauthPlugin.GITHUB_CONFIGURATION,
      },
      startRedirectPath: '/oauth/github',
      callbackUri: `${process.env.APP_URL || 'http://localhost:3000'}/oauth/github/callback`,
      scope: ['user:email'],
    });

    fastify.get('/github/callback', async (request, reply) => {
      try {
        const { token } = await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

        // Fetch user info from GitHub
        const response = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'User-Agent': 'AEOWEB',
          },
        });

        const githubUser = await response.json() as any;

        // Fetch email if not public
        let email = githubUser.email;
        if (!email) {
          const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${token.access_token}`,
              'User-Agent': 'AEOWEB',
            },
          });
          const emails = await emailResponse.json() as any[];
          email = emails.find(e => e.primary)?.email || emails[0]?.email;
        }

        // Find or create user
        let user = await findOrCreateOAuthUser('github', githubUser.id.toString(), {
          email: email,
          username: githubUser.login,
          emailVerified: githubUser.email !== null,
        });

        // Generate tokens
        const accessToken = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        });

        const refreshToken = nanoid(64);

        // Store session
        await pgPool.query(
          `INSERT INTO sessions (user_id, refresh_token, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
          [user.id, refreshToken]
        );

        // Redirect to frontend
        return reply.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }
    });
  }

  // Microsoft OAuth
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: 'microsoftOAuth2',
      credentials: {
        client: {
          id: process.env.MICROSOFT_CLIENT_ID,
          secret: process.env.MICROSOFT_CLIENT_SECRET,
        },
        auth: oauthPlugin.MICROSOFT_CONFIGURATION,
      },
      startRedirectPath: '/oauth/microsoft',
      callbackUri: `${process.env.APP_URL || 'http://localhost:3000'}/oauth/microsoft/callback`,
      scope: ['user.read'],
    });

    fastify.get('/microsoft/callback', async (request, reply) => {
      try {
        const { token } = await fastify.microsoftOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

        // Fetch user info from Microsoft
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });

        const msUser = await response.json() as any;

        // Find or create user
        let user = await findOrCreateOAuthUser('microsoft', msUser.id, {
          email: msUser.mail || msUser.userPrincipalName,
          username: msUser.displayName || msUser.userPrincipalName.split('@')[0],
          emailVerified: true,
        });

        // Generate tokens
        const accessToken = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        });

        const refreshToken = nanoid(64);

        // Store session
        await pgPool.query(
          `INSERT INTO sessions (user_id, refresh_token, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
          [user.id, refreshToken]
        );

        // Redirect to frontend
        return reply.redirect(
          `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }
    });
  }

  /**
   * GET /oauth/providers
   * List available OAuth providers
   */
  fastify.get('/providers', async (request, reply) => {
    const providers: string[] = [];

    if (process.env.GOOGLE_CLIENT_ID) providers.push('google');
    if (process.env.GITHUB_CLIENT_ID) providers.push('github');
    if (process.env.MICROSOFT_CLIENT_ID) providers.push('microsoft');

    return reply.send({ providers });
  });
}

/**
 * Helper: Find or create OAuth user
 */
async function findOrCreateOAuthUser(
  provider: string,
  providerUserId: string,
  userData: { email: string; username: string; emailVerified: boolean }
) {
  // Check if OAuth connection exists
  const connectionResult = await pgPool.query(
    'SELECT user_id FROM oauth_connections WHERE provider = $1 AND provider_user_id = $2',
    [provider, providerUserId]
  );

  if (connectionResult.rows.length > 0) {
    // Return existing user
    const userId = connectionResult.rows[0].user_id;
    const userResult = await pgPool.query(
      'SELECT id, email, username, role FROM users WHERE id = $1',
      [userId]
    );
    return userResult.rows[0];
  }

  // Check if user exists with this email
  const userResult = await pgPool.query(
    'SELECT id, email, username, role FROM users WHERE email = $1',
    [userData.email]
  );

  let user;

  if (userResult.rows.length > 0) {
    // Link OAuth to existing user
    user = userResult.rows[0];
  } else {
    // Create new user
    const newUserResult = await pgPool.query(
      `INSERT INTO users (email, username, password_hash, role, email_verified)
       VALUES ($1, $2, NULL, 'VIEWER', $3)
       RETURNING id, email, username, role`,
      [userData.email, userData.username, userData.emailVerified]
    );
    user = newUserResult.rows[0];
  }

  // Create OAuth connection
  await pgPool.query(
    `INSERT INTO oauth_connections (user_id, provider, provider_user_id)
     VALUES ($1, $2, $3)`,
    [user.id, provider, providerUserId]
  );

  return user;
}
