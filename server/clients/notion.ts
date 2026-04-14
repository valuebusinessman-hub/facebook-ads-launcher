import axios from 'axios';

const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

export interface NotionPageProperty {
  id: string;
  type: string;
  [key: string]: any;
}

export interface NotionPage {
  id: string;
  properties: Record<string, NotionPageProperty>;
  created_time: string;
  last_edited_time: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, any>;
}

export class NotionClient {
  private token: string;
  private headers: Record<string, string>;

  constructor(token: string) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Query a Notion database for pages matching criteria
   */
  async queryDatabase(databaseId: string, filter?: Record<string, any>): Promise<NotionPage[]> {
    try {
      const response = await axios.post(
        `${NOTION_BASE_URL}/databases/${databaseId}/query`,
        { filter },
        { headers: this.headers }
      );
      return response.data.results || [];
    } catch (error) {
      console.error('[Notion] Query database error:', error);
      throw error;
    }
  }

  /**
   * Get a specific page by ID
   */
  async getPage(pageId: string): Promise<NotionPage> {
    try {
      const response = await axios.get(
        `${NOTION_BASE_URL}/pages/${pageId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('[Notion] Get page error:', error);
      throw error;
    }
  }

  /**
   * Extract text content from a rich text property
   */
  extractRichText(richTextArray: any[]): string {
    if (!Array.isArray(richTextArray)) return '';
    return richTextArray.map(block => block.plain_text || '').join('');
  }

  /**
   * Extract image URL from a file property
   */
  extractImageUrl(fileProperty: any): string | null {
    if (!fileProperty) return null;
    if (fileProperty.type === 'external' && fileProperty.external?.url) {
      return fileProperty.external.url;
    }
    if (fileProperty.type === 'file' && fileProperty.file?.url) {
      return fileProperty.file.url;
    }
    return null;
  }

  /**
   * Extract select/status value
   */
  extractSelectValue(selectProperty: any): string | null {
    if (!selectProperty || !selectProperty.select) return null;
    return selectProperty.select.name || null;
  }

  /**
   * Update a page property (for writeback)
   */
  async updatePageProperty(pageId: string, properties: Record<string, any>): Promise<void> {
    try {
      await axios.patch(
        `${NOTION_BASE_URL}/pages/${pageId}`,
        { properties },
        { headers: this.headers }
      );
    } catch (error) {
      console.error('[Notion] Update page error:', error);
      throw error;
    }
  }

  /**
   * Find a database by name within a parent page
   * Note: This requires searching through child blocks
   */
  async findDatabaseByName(parentPageId: string, databaseName: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${NOTION_BASE_URL}/blocks/${parentPageId}/children`,
        { headers: this.headers }
      );

      const blocks = response.data.results || [];
      for (const block of blocks) {
        if (block.type === 'child_database' && block.child_database?.title === databaseName) {
          return block.id;
        }
      }
      return null;
    } catch (error) {
      console.error('[Notion] Find database error:', error);
      throw error;
    }
  }

  /**
   * Download image from Notion URL (handles temporary signed URLs)
   */
  async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AdLauncher/1.0)',
        },
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('[Notion] Download image error:', error);
      throw error;
    }
  }
}

/**
 * Parse ad draft from Notion page
 * Assumes the database has properties: Headline, Primary Text, Image, Status, Targeting
 */
export function parseAdDraftFromNotion(page: NotionPage, client: NotionClient): {
  notionPageId: string;
  headline: string;
  primaryText: string;
  imageUrl: string | null;
  status: string;
  targeting: Record<string, any> | null;
} {
  const props = page.properties;

  return {
    notionPageId: page.id,
    headline: props.Headline?.title ? client.extractRichText(props.Headline.title) : '',
    primaryText: props['Primary Text']?.rich_text ? client.extractRichText(props['Primary Text'].rich_text) : '',
    imageUrl: props.Image?.files ? client.extractImageUrl(props.Image.files[0]) : null,
    status: props.Status?.select ? props.Status.select.name : 'Pending Review',
    targeting: props.Targeting?.rich_text ? JSON.parse(client.extractRichText(props.Targeting.rich_text)) : null,
  };
}

/**
 * Helper to extract rich text
 */
function extractRichText(richTextArray: any[]): string {
  if (!Array.isArray(richTextArray)) return '';
  return richTextArray.map(block => block.plain_text || '').join('');
}
