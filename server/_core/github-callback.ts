import { Request, Response } from 'express';
import { githubOAuth } from './github-oauth';
import { upsertUser } from '../db';
import { getSessionCookieOptions } from './cookies';
import { COOKIE_NAME } from '@shared/const';
import * as jose from 'jose';

export async function handleGitHubCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Exchange code for access token
    const accessToken = await githubOAuth.getAccessToken(code);

    // Get user info from GitHub
    const githubUser = await githubOAuth.getUser(accessToken);
    const email = await githubOAuth.getUserEmail(accessToken);

    // Create unique openId from GitHub user ID
    const openId = `github_${githubUser.id}`;

    // Upsert user in database
    await upsertUser({
      openId,
      name: githubUser.name || githubUser.login,
      email: email || githubUser.email,
      loginMethod: 'github',
      lastSignedIn: new Date(),
    });

    // Create JWT session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const token = await new jose.SignJWT({ openId, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    // Redirect to dashboard
    const returnPath = (state as string) || '/dashboard';
    res.redirect(returnPath);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
