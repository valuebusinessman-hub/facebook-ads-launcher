# Facebook Ads Launcher - API Research & Architecture

## 1. Notion API Integration

### Database Querying
- **Endpoint:** `POST /v1/databases/{database_id}/query`
- **Purpose:** Retrieve pages from "Schedule New Ad Creatives SOP - Allsleepers" database
- **Key Parameters:**
  - `filter`: Filter by status (e.g., "Pending Review")
  - `sorts`: Order by creation date
  - `page_size`: Pagination support (max 100)

### Page Properties
- **Text fields:** Headlines, primary text, descriptions
- **File properties:** Image URLs (stored as Notion file blocks)
- **Select/Status:** Current approval status
- **Relations:** Links to campaign/targeting info

### Writeback Operations
- **Endpoint:** `PATCH /v1/pages/{page_id}`
- **Purpose:** Update status to "Launched" and add Facebook Ad ID
- **Fields to update:**
  - Status property → "Launched"
  - Custom field for Facebook Ad ID

### Image Handling
- **File URLs:** Notion returns temporary signed URLs for images
- **Expiration:** URLs expire after ~1 hour
- **Strategy:** Download immediately and upload to Facebook

---

## 2. Facebook Marketing API Integration

### Campaign Creation
- **Endpoint:** `POST /act_{AD_ACCOUNT_ID}/campaigns`
- **Required Fields:**
  - `name`: Campaign name
  - `objective`: Campaign objective (e.g., "CONVERSIONS", "LINK_CLICKS")
  - `status`: "PAUSED" or "ACTIVE"

### Ad Set Creation
- **Endpoint:** `POST /act_{AD_ACCOUNT_ID}/adsets`
- **Required Fields:**
  - `campaign_id`: Parent campaign ID
  - `name`: Ad set name
  - `targeting`: Audience targeting (from Notion)
  - `daily_budget` or `lifetime_budget`
  - `start_time`, `end_time`: Schedule

### Ad Creative Creation
- **Endpoint:** `POST /act_{AD_ACCOUNT_ID}/adcreatives`
- **Fields:**
  - `name`: Creative name
  - `object_story_spec`: Defines ad structure
  - `image_hash` or `video_id`: Media reference

### Image Upload to Media Library
- **Endpoint:** `POST /act_{AD_ACCOUNT_ID}/adimages`
- **Process:**
  1. Download image from Notion URL
  2. Upload to Facebook as multipart form data
  3. Receive `image_hash` for use in ad creative

### Ad Creation
- **Endpoint:** `POST /act_{AD_ACCOUNT_ID}/ads`
- **Fields:**
  - `adset_id`: Parent ad set
  - `creative`: Creative ID
  - `status`: "PAUSED" or "ACTIVE"

---

## 3. LLM Integration for Copy Suggestions

### Use Case
- **Input:** Headline and primary text from Notion
- **Process:** Send to LLM with brand guidelines context
- **Output:** Suggested improvements with reasoning
- **User Action:** Owner reviews and optionally applies suggestions

### Prompt Structure
```
System: "You are a copywriting expert for Allsleepers, a premium sleep brand. 
Review the following ad copy and suggest improvements for clarity, persuasion, and brand voice."

User: "[Headline]\n[Primary Text]"

Response: Structured suggestions with original vs. improved versions
```

### Integration Point
- Called during approval dashboard preview
- Results cached in app database
- Owner can apply with one click

---

## 4. Database Schema Design

### Core Tables

#### `ad_drafts`
- `id`: Primary key
- `notion_page_id`: Reference to Notion page
- `headline`: Ad headline text
- `primary_text`: Ad body text
- `image_url`: URL to image (from Notion)
- `image_hash`: Facebook image hash (after upload)
- `targeting_json`: Audience targeting data
- `status`: "Pending Review" | "Approved" | "Rejected" | "Launched" | "Failed"
- `created_at`, `updated_at`

#### `llm_suggestions`
- `id`: Primary key
- `ad_draft_id`: Foreign key to ad_drafts
- `original_headline`: Original headline
- `suggested_headline`: LLM suggestion
- `original_text`: Original primary text
- `suggested_text`: LLM suggestion
- `reasoning`: Why the suggestion improves the copy
- `created_at`

#### `facebook_launches`
- `id`: Primary key
- `ad_draft_id`: Foreign key to ad_drafts
- `campaign_id`: Facebook campaign ID
- `adset_id`: Facebook ad set ID
- `ad_id`: Facebook ad ID
- `creative_id`: Facebook creative ID
- `image_hash`: Facebook image hash used
- `status`: "Pending" | "Success" | "Failed"
- `error_message`: If failed
- `launched_at`, `updated_at`

#### `settings`
- `id`: Primary key
- `key`: Setting name (e.g., "notion_token", "facebook_app_id")
- `value`: Encrypted value
- `updated_at`

---

## 5. Workflow Architecture

### Step 1: Sync from Notion
1. Backend fetches all pages with status "Pending Review"
2. Extracts headline, text, images, targeting
3. Stores in `ad_drafts` table
4. Downloads images from Notion (temporary URLs)

### Step 2: LLM Review (Optional)
1. Owner navigates to approval dashboard
2. For each draft, LLM generates copy suggestions
3. Suggestions stored in `llm_suggestions` table
4. Owner sees original + suggested copy side-by-side

### Step 3: Approval & Launch
1. Owner reviews draft and LLM suggestions
2. Owner can:
   - Approve with original copy
   - Approve with LLM suggestions
   - Edit copy manually
   - Reject draft
3. On approval:
   - Upload image to Facebook
   - Create campaign → ad set → ad creative → ad
   - Store Facebook IDs in `facebook_launches`
   - Update Notion page: status="Launched", add Facebook Ad ID
   - Send owner notification

### Step 4: Error Handling
- If any step fails, mark as "Failed" and notify owner
- Owner can retry from dashboard

---

## 6. API Credentials & Security

### Required Credentials
1. **Notion Integration Token:** Bearer token for API access
2. **Facebook App ID:** OAuth app identifier
3. **Facebook App Secret:** OAuth secret
4. **Facebook Ad Account ID:** Account to launch ads into
5. **Facebook Access Token:** User access token (generated via OAuth)

### Storage Strategy
- Store in `settings` table with encryption
- Settings page allows owner to update credentials
- Never expose in frontend code or logs

---

## 7. Implementation Priorities

### Phase 2 (Backend)
- [ ] Database schema and migrations
- [ ] Notion API client (query database, retrieve pages)
- [ ] Facebook API client (campaigns, ad sets, ads, images)
- [ ] LLM integration for copy suggestions
- [ ] tRPC procedures for all operations

### Phase 3 (Frontend - UI)
- [ ] Editorial aesthetic design system
- [ ] Approval dashboard layout
- [ ] Ad preview cards
- [ ] LLM suggestion display

### Phase 4 (Settings & Security)
- [ ] Settings page for credentials
- [ ] Encryption for sensitive data
- [ ] OAuth flow for Facebook

### Phase 5 (Launch Flow)
- [ ] Image download and upload
- [ ] Facebook campaign creation
- [ ] Notion writeback
- [ ] Error handling and retries

### Phase 6 (Polish & Testing)
- [ ] End-to-end testing
- [ ] Documentation
- [ ] Deployment

