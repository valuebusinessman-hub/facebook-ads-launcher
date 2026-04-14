# GitHub OAuth Setup Guide

This application uses GitHub OAuth for authentication. Follow these steps to set it up.

## Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" in the left sidebar
3. Click "New OAuth App"
4. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Application name** | `Facebook Ads Launcher` |
   | **Homepage URL** | `https://facebook-ads-launcher-xxx.vercel.app` |
   | **Application description** | `Ad approval and launch control center` |
   | **Authorization callback URL** | `https://facebook-ads-launcher-xxx.vercel.app/auth/callback` |

5. Click "Register application"

## Step 2: Get Your Credentials

After registration, you'll see:

- **Client ID** (starts with a number)
- **Client Secret** (click "Generate" to create one)

**⚠️ Important:** Keep your Client Secret private! Never share it publicly.

## Step 3: Add to Railway

1. Go to your Railway project
2. Click "Variables"
3. Add these environment variables:

   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_REDIRECT_URL=https://facebook-ads-launcher-xxx.vercel.app/auth/callback
   ```

4. Railway will auto-redeploy with the new variables

## Step 4: Test Login

1. Go to your live app: `https://facebook-ads-launcher-xxx.vercel.app`
2. Click "Sign In"
3. You'll be redirected to GitHub
4. Authorize the app
5. You'll be logged in!

## Troubleshooting

### "Invalid redirect_uri" error
- Make sure your `GITHUB_REDIRECT_URL` exactly matches the "Authorization callback URL" in your GitHub app settings
- Include `https://` (not `http://`)
- No trailing slash

### "Client ID not found" error
- Check that `GITHUB_CLIENT_ID` is set in Railway
- Make sure it's the correct value from GitHub settings
- Restart the Railway deployment after adding variables

### Can't authorize the app
- Make sure you're logged into GitHub
- Check that the GitHub OAuth app is still active
- Try creating a new GitHub OAuth app if the old one is deleted

## How It Works

1. User clicks "Sign In"
2. Redirected to GitHub login
3. User authorizes the app
4. GitHub redirects back with authorization code
5. App exchanges code for access token
6. App fetches user info from GitHub
7. User is logged in and session is created

## Security Notes

- Client Secret is never exposed to the frontend
- All OAuth communication happens server-to-server
- Session tokens are signed and encrypted
- Cookies are secure and HTTP-only

## Need Help?

- GitHub OAuth Docs: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps
- Railway Docs: https://docs.railway.app
