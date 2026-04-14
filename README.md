# Facebook Ads Launcher

An intelligent ad launch control center for the Allsleepers brand that connects Notion, Facebook Marketing API, and an LLM to streamline the review, approval, and publishing of ad creatives.

## Overview

The Facebook Ads Launcher is a sophisticated web application designed to:

1. **Sync ad drafts from Notion** - Pull headlines, copy, images, and targeting from your "Schedule New Ad Creatives SOP - Allsleepers" database
2. **Generate AI suggestions** - Use an LLM to suggest improvements to ad copy before approval
3. **Approve with editorial control** - Review drafts with an elegant dashboard and optionally apply AI suggestions
4. **Launch to Facebook** - Automatically create campaigns, ad sets, creatives, and ads with one click
5. **Track everything** - Monitor launch status and write back results to Notion

## Features

### ✨ Core Capabilities

- **Notion Integration**: Automatic sync of ad drafts with image handling and targeting data
- **LLM Copy Suggestions**: AI-powered improvements to headlines and primary text with optional application
- **Facebook Ad Launch**: One-click creation of complete ad campaigns with proper hierarchy
- **Image Management**: Automatic download from Notion and upload to Facebook media library
- **Status Tracking**: Track ad drafts through Pending Review → Approved → Launched → Success/Failed
- **Notion Writeback**: Update Notion pages with launch status and Facebook Ad IDs
- **Secure Credentials**: Encrypted storage of API tokens and secrets
- **Editorial Design**: Sophisticated, minimalist UI with cream background and serif typography

### 🎨 Design Aesthetic

- **Minimalist cream background** (#faf7f2) for a clean, professional look
- **Bodoni Moda serif headlines** for bold, high-contrast typography
- **Crimson Text serif body** for elegant readability
- **Inter sans-serif details** for precise, technical information
- **Generous negative space** and asymmetrical balance for intellectual sophistication

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **tRPC** for type-safe API calls
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **Drizzle ORM** for type-safe database queries
- **MySQL** for data persistence
- **tRPC** for API procedures

### Integrations
- **Notion API** for database sync and writeback
- **Facebook Marketing API** for ad creation
- **OpenAI LLM** for copy suggestions

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- MySQL 8.0+
- Notion workspace with integration token
- Facebook app with Marketing API access

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fb-ads-launcher

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/allsleepers_ads

# OAuth
MANUS_OAUTH_CLIENT_ID=your_client_id
MANUS_OAUTH_CLIENT_SECRET=your_client_secret
MANUS_OAUTH_REDIRECT_URL=http://localhost:3000/auth/callback

# Owner
OWNER_OPEN_ID=your_owner_open_id

# API Keys (configured via Settings page in production)
# NOTION_TOKEN=ntn_...
# FACEBOOK_ACCESS_TOKEN=EAAB...
# FACEBOOK_AD_ACCOUNT_ID=123456789
```

## Usage

### 1. Configure API Credentials

1. Go to **Settings** page
2. Enter your **Notion Integration Token** and **Database ID**
3. Enter your **Facebook Access Token** and **Ad Account ID**
4. Click "Validate Connections" to verify

### 2. Sync Ad Drafts

1. Go to **Dashboard**
2. Click "Sync from Notion"
3. Drafts with status "Pending Review" will be imported

### 3. Review and Approve

1. View ad draft with headline, primary text, and image
2. (Optional) Click "Generate Suggestions" to get AI improvements
3. Review LLM suggestions side-by-side with original copy
4. Choose to use original or suggested copy
5. Click "Approve & Launch" to create Facebook ads

### 4. Track Results

- Dashboard shows status: Pending Review → Approved → Launched → Success/Failed
- Notion pages are updated with launch status and Facebook Ad IDs
- View Facebook campaign/ad set/ad/creative IDs in the database

## Database Schema

### ad_drafts
Stores Notion ad drafts with status tracking and Facebook references.

```sql
- id: Primary key
- notionPageId: Reference to Notion page
- headline: Ad headline
- primaryText: Ad body text
- imageUrl: URL to image from Notion
- imageHash: Facebook image hash after upload
- targetingJson: Audience targeting data
- status: Pending Review | Approved | Rejected | Launched | Failed
- facebookAdId: Facebook ad ID after launch
- createdAt, updatedAt: Timestamps
```

### llm_suggestions
Caches LLM-generated copy improvement suggestions.

```sql
- id: Primary key
- adDraftId: Foreign key to ad_drafts
- originalHeadline, suggestedHeadline: Headline comparison
- originalText, suggestedText: Copy comparison
- reasoning: Why the suggestion improves the copy
- createdAt: Timestamp
```

### facebook_launches
Records Facebook campaign/ad IDs for launched ads.

```sql
- id: Primary key
- adDraftId: Foreign key to ad_drafts
- campaignId, adsetId, adId, creativeId: Facebook IDs
- imageHash: Facebook image hash used
- launchStatus: Pending | Success | Failed
- errorMessage: If launch failed
- launchedAt, updatedAt: Timestamps
```

### settings
Encrypted storage for API credentials.

```sql
- id: Primary key
- key: Setting name (notion_token, facebook_access_token, etc.)
- value: Encrypted value
- updatedAt: Timestamp
```

## API Endpoints (tRPC)

### Drafts Router
- `drafts.list` - Get all drafts with optional status filter
- `drafts.getById` - Get single draft with suggestions and launch info
- `drafts.generateSuggestions` - Generate LLM copy suggestions
- `drafts.approve` - Approve and launch to Facebook
- `drafts.reject` - Reject a draft

### Notion Router
- `notion.syncDrafts` - Sync pending drafts from Notion database

### Settings Router
- `settings.getStatus` - Get connection status for Notion and Facebook
- `settings.updateCredentials` - Update API credentials
- `settings.validateCredentials` - Test API connections

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy (Vercel + Railway)

1. Push code to GitHub
2. Deploy backend to Railway
3. Deploy frontend to Vercel
4. Configure environment variables
5. Update OAuth redirect URLs

**Estimated cost:** $5-10/month

## Project Structure

```
fb-ads-launcher/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app with routing
│   │   └── index.css      # Editorial design system
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── clients/           # API clients (Notion, Facebook, LLM)
│   ├── db.ts              # Database helpers
│   ├── routers.ts         # tRPC procedures
│   └── _core/             # Core utilities
├── drizzle/               # Database schema and migrations
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

## Key Files

| File | Purpose |
|------|---------|
| `server/clients/notion.ts` | Notion API integration for sync and writeback |
| `server/clients/facebook.ts` | Facebook Marketing API for ad creation |
| `server/clients/llm.ts` | LLM integration for copy suggestions |
| `server/db.ts` | Database query helpers |
| `server/routers.ts` | tRPC API procedures |
| `client/src/pages/Dashboard.tsx` | Main approval interface |
| `client/src/pages/Settings.tsx` | Credential management |
| `client/src/components/AdDraftCard.tsx` | Ad preview component |
| `client/src/index.css` | Editorial design system |

## Status Labels

The application uses exact status labels that must match Notion:

- **Pending Review** - Draft ready for owner approval
- **Approved** - Approved but not yet launched
- **Rejected** - Rejected by owner
- **Launched** - Successfully created on Facebook
- **Failed** - Launch encountered an error

## Security

- All API credentials are encrypted in the database
- Credentials are never exposed in frontend code or logs
- Only the owner can access settings
- Secure session management with OAuth
- HTTPS/SSL in production

## Troubleshooting

### Notion sync fails
- Verify integration token is valid
- Ensure database ID is correct
- Check that integration has access to the page
- Review server logs for error details

### Facebook launch fails
- Verify access token is valid and not expired
- Check ad account ID is correct
- Ensure account has sufficient permissions
- Review error message in dashboard

### Images not uploading
- Verify image URLs are accessible
- Check file size is under Facebook limits
- Ensure image format is supported (JPG, PNG, etc.)

### LLM suggestions not generating
- Verify OpenAI API key is configured
- Check API quota hasn't been exceeded
- Review error message in browser console

## Contributing

This is a production application for Allsleepers. Changes should be:

1. Tested locally
2. Committed with clear messages
3. Deployed to staging first
4. Reviewed before production deployment

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review server logs in deployment platform
3. Check browser console for frontend errors
4. Verify API credentials are correct

## License

Proprietary - Allsleepers, Inc.

## Changelog

### v1.0.0 (Initial Release)
- Complete Notion integration with sync and writeback
- Facebook ad creation with full campaign hierarchy
- LLM-powered copy suggestions
- Editorial design system
- Secure credential management
- Production-ready deployment configuration
