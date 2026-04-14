# Deploy to Vercel (Free)

## Quick Start - Deploy in 2 Minutes

### Step 1: Go to Vercel
1. Visit https://vercel.com
2. Click "Sign Up" (or "Sign In" if you have an account)
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your Repository
1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Find and select `facebook-ads-launcher`
4. Click "Import"

### Step 3: Configure Environment Variables
1. Under "Environment Variables", add:
   ```
   VITE_API_URL = https://your-railway-api-url.railway.app
   ```
   (You'll get the Railway URL after deploying the backend)

2. Click "Deploy"

### That's It! 🎉
Vercel will automatically:
- Build your React app
- Deploy to a live URL
- Set up SSL/HTTPS
- Enable auto-deployments on every GitHub push

## Your Live URL
After deployment, you'll get a URL like:
```
https://facebook-ads-launcher-xxx.vercel.app
```

Or with a custom domain:
```
https://ads.allsleepers.com
```

## What's Included (Free Tier)
✅ Unlimited deployments
✅ Automatic SSL/HTTPS
✅ Global CDN
✅ Preview deployments for pull requests
✅ Custom domains
✅ 24/7 uptime

## Next: Deploy Backend to Railway
After Vercel is live, deploy the backend to Railway:
1. Go to https://railway.app
2. Click "Create New Project"
3. Select "Deploy from GitHub repo"
4. Choose `facebook-ads-launcher`
5. Configure environment variables (see DEPLOYMENT.md)
6. Copy the API URL and update Vercel's `VITE_API_URL`

## Support
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
