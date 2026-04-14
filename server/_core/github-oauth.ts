import { ENV } from './env';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export class GitHubOAuthClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUrl: string;

  constructor() {
    this.clientId = ENV.githubClientId;
    this.clientSecret = ENV.githubClientSecret;
    this.redirectUrl = ENV.githubRedirectUrl;
  }

  /**
   * Get the GitHub OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUrl,
      scope: 'user:email',
      state: state || Math.random().toString(36).substring(7),
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUrl,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description}`);
    }

    return data.access_token;
  }

  /**
   * Get authenticated user info from GitHub
   */
  async getUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user');
    }

    return response.json();
  }

  /**
   * Get user email (may be private on GitHub)
   */
  async getUserEmail(accessToken: string): Promise<string | null> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const emails = await response.json();
    const primaryEmail = emails.find((e: any) => e.primary);
    return primaryEmail?.email || emails[0]?.email || null;
  }
}

export const githubOAuth = new GitHubOAuthClient();
