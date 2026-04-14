# Facebook Ads Launcher - Deployment Guide

## Overview

This guide explains how to deploy the Facebook Ads Launcher as a permanent website with 24/7 hosting.

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

**Frontend: Vercel**
- Free tier available
- Automatic deployments from GitHub
- Built-in SSL/HTTPS
- Global CDN

**Backend: Railway**
- Affordable ($5-20/month)
- MySQL database included
- Easy environment variable management
- 24/7 uptime

### Option 2: AWS

**Components:**
- EC2 for backend server
- RDS for MySQL database
- CloudFront for CDN
- Route 53 for DNS

### Option 3: Self-Hosted

**Requirements:**
- Linux server (Ubuntu 22.04+)
- Node.js 18+
- MySQL 8.0+
- Docker (recommended)
- Nginx or Apache for reverse proxy

## Step-by-Step Deployment (Vercel + Railway)

### 1. Prepare Your Repository

```bash
# Ensure all changes are committed
git add -A
git commit -m "Prepare for production deployment"

# Push to GitHub
git push origin main
```

### 2. Deploy Backend to Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Configure environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=mysql://[user]:[password]@[host]:3306/[database]
   MANUS_OAUTH_CLIENT_ID=[your_oauth_client_id]
   MANUS_OAUTH_CLIENT_SECRET=[your_oauth_client_secret]
   MANUS_OAUTH_REDIRECT_URL=https://[your-domain].com/auth/callback
   OWNER_OPEN_ID=[your_owner_open_id]
   ```
6. Railway will automatically detect the Node.js app and deploy
7. Copy the generated domain (e.g., `api-production-xxxx.railway.app`)

### 3. Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Import Project"
4. Select your repository
5. Configure build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `pnpm build`
   - **Output Directory:** `client/dist`
6. Set environment variables:
   ```
   VITE_API_URL=https://[railway-domain].railway.app
   ```
7. Click "Deploy"

### 4. Configure Custom Domain (Optional)

**For Vercel:**
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., ads.allsleepers.com)
3. Update DNS records as shown

**For Railway:**
1. Go to Project Settings → Domains
2. Add custom domain for API

### 5. Set Up Database

**On Railway:**
1. Add MySQL plugin to your project
2. Railway will provide connection string
3. Run migrations:
   ```bash
   DATABASE_URL="[connection_string]" pnpm db:push
   ```

### 6. Configure OAuth

1. Update your OAuth provider (Manus) with new URLs:
   - Frontend: `https://[your-domain].com`
   - Callback: `https://[your-domain].com/auth/callback`

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] OAuth credentials updated
- [ ] SSL/HTTPS enabled
- [ ] Custom domain configured
- [ ] Backups enabled
- [ ] Monitoring set up
- [ ] Error logging configured
- [ ] API rate limiting enabled
- [ ] CORS properly configured

## Monitoring & Maintenance

### Health Checks

```bash
# Check backend health
curl https://[api-domain]/health

# Check frontend
curl https://[your-domain].com
```

### Logs

**Vercel:** Dashboard → Deployments → Logs
**Railway:** Dashboard → Logs

### Backups

**Railway MySQL:**
- Automatic daily backups
- Retention: 7 days
- Manual backups available

## Scaling

### If you need more resources:

1. **Vercel:** Upgrade to Pro ($20/month)
2. **Railway:** Increase compute resources ($5-50/month)
3. **Database:** Upgrade MySQL tier on Railway

## Troubleshooting

### Deployment fails

1. Check logs in Vercel/Railway dashboard
2. Verify environment variables are set
3. Ensure database connection string is correct
4. Check GitHub repository is public or Railway has access

### API not responding

1. Check Railway logs
2. Verify database connection
3. Check environment variables
4. Restart deployment

### Frontend can't connect to API

1. Verify `VITE_API_URL` is correct
2. Check CORS settings on backend
3. Verify API is running
4. Check network tab in browser dev tools

## Cost Estimate

| Service | Free Tier | Pro Tier |
|---------|-----------|----------|
| Vercel | ✓ Included | $20/month |
| Railway | $5/month | $50+/month |
| Domain | $10-15/year | $10-15/year |
| **Total** | **~$5-10/month** | **~$35-50/month** |

## Support

For deployment issues:
1. Check Railway/Vercel documentation
2. Review application logs
3. Verify environment configuration
4. Test locally before deploying

## Next Steps

After deployment:
1. Test all features in production
2. Configure API credentials (Notion, Facebook)
3. Set up monitoring and alerts
4. Document your deployment setup
5. Create backup procedures
