import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_BASE_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

export interface FacebookCampaignParams {
  name: string;
  objective: string;
  status?: 'PAUSED' | 'ACTIVE';
}

export interface FacebookAdSetParams {
  campaign_id: string;
  name: string;
  targeting: Record<string, any>;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  end_time?: string;
  status?: 'PAUSED' | 'ACTIVE';
}

export interface FacebookAdCreativeParams {
  name: string;
  object_story_spec: Record<string, any>;
}

export interface FacebookAdParams {
  adset_id: string;
  creative: Record<string, any>;
  status?: 'PAUSED' | 'ACTIVE';
  name?: string;
}

export class FacebookClient {
  private accessToken: string;
  private adAccountId: string;
  private headers: Record<string, string>;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a campaign
   */
  async createCampaign(params: FacebookCampaignParams): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${FACEBOOK_BASE_URL}/act_${this.adAccountId}/campaigns`,
        {
          ...params,
          status: params.status || 'PAUSED',
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('[Facebook] Create campaign error:', error);
      throw error;
    }
  }

  /**
   * Create an ad set
   */
  async createAdSet(params: FacebookAdSetParams): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${FACEBOOK_BASE_URL}/act_${this.adAccountId}/adsets`,
        {
          ...params,
          status: params.status || 'PAUSED',
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('[Facebook] Create ad set error:', error);
      throw error;
    }
  }

  /**
   * Upload image to Facebook media library
   */
  async uploadImage(imageBuffer: Buffer, filename: string): Promise<{ image_hash: string }> {
    try {
      const form = new FormData();
      form.append('file', imageBuffer, filename);

      const response = await axios.post(
        `${FACEBOOK_BASE_URL}/act_${this.adAccountId}/adimages`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('[Facebook] Upload image error:', error);
      throw error;
    }
  }

  /**
   * Create an ad creative
   */
  async createAdCreative(params: FacebookAdCreativeParams): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${FACEBOOK_BASE_URL}/act_${this.adAccountId}/adcreatives`,
        params,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('[Facebook] Create creative error:', error);
      throw error;
    }
  }

  /**
   * Create an ad
   */
  async createAd(params: FacebookAdParams): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${FACEBOOK_BASE_URL}/act_${this.adAccountId}/ads`,
        {
          ...params,
          status: params.status || 'PAUSED',
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('[Facebook] Create ad error:', error);
      throw error;
    }
  }

  /**
   * Build object story spec for ad creative (for feed ads)
   */
  buildObjectStorySpec(
    headline: string,
    primaryText: string,
    imageHash: string,
    pageId?: string
  ): Record<string, any> {
    return {
      page_id: pageId || this.adAccountId,
      link_data: {
        headline: headline,
        message: primaryText,
        image_hash: imageHash,
        call_to_action: {
          type: 'LEARN_MORE',
        },
      },
    };
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${FACEBOOK_BASE_URL}/me`,
        { headers: this.headers }
      );
      return !!response.data.id;
    } catch (error) {
      console.error('[Facebook] Token validation error:', error);
      return false;
    }
  }

  /**
   * Get ad account info
   */
  async getAdAccountInfo(): Promise<Record<string, any>> {
    try {
      const response = await axios.get(
        `${FACEBOOK_BASE_URL}/act_${this.adAccountId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('[Facebook] Get ad account error:', error);
      throw error;
    }
  }
}

/**
 * Helper to build targeting from Notion data
 */
export function buildFacebookTargeting(notionTargeting: Record<string, any>): Record<string, any> {
  // Default targeting if not provided
  if (!notionTargeting) {
    return {
      geo_locations: {
        countries: ['US'],
      },
      age_min: 18,
      age_max: 65,
    };
  }

  // Map Notion targeting fields to Facebook format
  return {
    geo_locations: notionTargeting.geo_locations || { countries: ['US'] },
    age_min: notionTargeting.age_min || 18,
    age_max: notionTargeting.age_max || 65,
    interests: notionTargeting.interests || [],
    behaviors: notionTargeting.behaviors || [],
    publisher_platforms: notionTargeting.publisher_platforms || ['facebook', 'instagram'],
    facebook_positions: notionTargeting.facebook_positions || ['feed'],
  };
}
