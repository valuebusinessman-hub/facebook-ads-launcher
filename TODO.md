# Facebook Ads Launcher - Development Checklist

## Phase 2: Backend Architecture & Database Schema

- [ ] Update `drizzle/schema.ts` with all required tables:
  - `ad_drafts` - Store Notion ad drafts with status tracking
  - `llm_suggestions` - Store LLM copy improvement suggestions
  - `facebook_launches` - Track Facebook campaign/ad IDs and launch status
  - `settings` - Store encrypted API credentials
  - `notion_sync_log` - Track sync history and errors

- [ ] Create database helpers in `server/db.ts`:
  - `getAdDraftsByStatus()` - Fetch drafts by approval status
  - `createAdDraft()` - Insert new draft from Notion
  - `updateAdDraftStatus()` - Update approval status
  - `saveLLMSuggestions()` - Store copy suggestions
  - `recordFacebookLaunch()` - Log successful launch
  - `getSetting()` / `setSetting()` - Manage encrypted credentials

- [ ] Implement Notion API client (`server/clients/notion.ts`):
  - Query "Schedule New Ad Creatives SOP - Allsleepers" database
  - Retrieve page properties (headline, text, images, targeting)
  - Download images from temporary Notion URLs
  - Update page status to "Launched" and add Facebook Ad ID

- [ ] Implement Facebook API client (`server/clients/facebook.ts`):
  - Create campaigns
  - Create ad sets with targeting
  - Upload images to media library
  - Create ad creatives
  - Create and launch ads
  - Handle error responses

- [ ] Implement LLM integration (`server/clients/llm.ts`):
  - Generate copy improvement suggestions
  - Format suggestions with reasoning
  - Cache results to avoid duplicate API calls

- [ ] Create tRPC procedures in `server/routers.ts`:
  - `notion.syncDrafts()` - Pull latest drafts from Notion
  - `drafts.list()` - Get all drafts with pagination
  - `drafts.getById()` - Get single draft with LLM suggestions
  - `drafts.generateSuggestions()` - Generate LLM copy suggestions
  - `drafts.approve()` - Approve and launch to Facebook
  - `drafts.reject()` - Reject draft
  - `settings.getCredentials()` - Retrieve stored credentials
  - `settings.updateCredentials()` - Update API keys
  - `launches.getStatus()` - Check launch status

## Phase 3: Frontend - Approval Dashboard UI

- [ ] Design system with editorial aesthetic:
  - Cream background color palette
  - Didone serif font for headlines
  - Elegant serif for subheadings
  - Minimalist sans-serif for details
  - Geometric lines and spacing

- [ ] Create layout components:
  - Main dashboard layout (sidebar + content area)
  - Header with Allsleepers branding
  - Navigation for drafts, settings, history

- [ ] Build approval dashboard page:
  - List of pending review drafts
  - Filter by status
  - Search functionality
  - Pagination

- [ ] Implement ad preview card:
  - Display headline, primary text, image
  - Show targeting information
  - Display LLM suggestions side-by-side with original
  - Action buttons (Approve, Reject, Edit)

- [ ] Create copy suggestion UI:
  - Show original vs. suggested copy
  - Display reasoning from LLM
  - One-click apply button
  - Manual edit option

- [ ] Build approval flow:
  - Preview draft details
  - Review LLM suggestions
  - Choose to apply suggestions or keep original
  - Confirm and launch

## Phase 4: Settings & Credential Management

- [ ] Create settings page:
  - Form for Notion Integration Token
  - Form for Facebook App ID and Secret
  - Form for Facebook Ad Account ID
  - Save button with validation
  - Encrypted storage confirmation

- [ ] Implement credential validation:
  - Test Notion API connection
  - Test Facebook API connection
  - Show connection status

- [ ] Add authentication check:
  - Ensure only owner can access settings
  - Require admin role for credential updates

## Phase 5: Image Handling & Launch Flow

- [ ] Implement image download workflow:
  - Fetch image from Notion temporary URL
  - Convert to buffer
  - Store temporarily in memory or S3

- [ ] Implement Facebook image upload:
  - Upload image to Facebook media library
  - Receive and store image_hash
  - Associate hash with ad draft

- [ ] Build Facebook campaign creation:
  - Create campaign with name from Notion
  - Set objective based on ad type
  - Set status to PAUSED initially

- [ ] Build Facebook ad set creation:
  - Link to campaign
  - Apply targeting from Notion
  - Set budget and schedule

- [ ] Build Facebook ad creation:
  - Create ad creative with image and copy
  - Create ad linked to ad set
  - Set status to PAUSED

- [ ] Implement Notion writeback:
  - Update page status to "Launched"
  - Add Facebook Ad ID to page
  - Add campaign/ad set/creative IDs if needed

- [ ] Add error handling:
  - Catch API errors at each step
  - Log errors to database
  - Notify owner of failures
  - Allow retry from dashboard

- [ ] Implement owner notifications:
  - Notify when new drafts ready for review
  - Notify on successful launch
  - Notify on launch failure with error details

## Phase 6: Testing & Deployment

- [ ] Write backend tests:
  - Test Notion API client
  - Test Facebook API client
  - Test LLM integration
  - Test tRPC procedures

- [ ] Write frontend tests:
  - Test dashboard rendering
  - Test approval flow
  - Test form submissions

- [ ] Manual testing:
  - Test full workflow end-to-end
  - Test error scenarios
  - Test credential updates

- [ ] Documentation:
  - Setup guide for Notion integration token
  - Setup guide for Facebook app credentials
  - User guide for approval workflow
  - Troubleshooting guide

- [ ] Deployment:
  - Create checkpoint
  - Deploy to production
  - Monitor for errors

## Known Constraints & Requirements

- Notion database name: "Schedule New Ad Creatives SOP - Allsleepers"
- Parent Notion page: "Allsleepers Growth Engine - Central Intelligence Database"
- Status labels: Pending Review, Approved, Rejected, Launched, Failed
- Notion writeback must include status update AND Facebook Ad ID on same page
- LLM suggestions must be optional (owner decides to apply or not)
- UI must use sophisticated editorial aesthetic with cream background and Didone serif
- All credentials must be encrypted and never exposed in frontend

