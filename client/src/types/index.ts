export interface AdDraft {
  id: number;
  notionPageId: string;
  headline: string;
  primaryText: string;
  imageUrl?: string | null;
  imageHash?: string | null;
  targetingJson?: Record<string, any> | null;
  status: "Pending Review" | "Approved" | "Rejected" | "Launched" | "Failed";
  facebookAdId?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMSuggestion {
  id: number;
  adDraftId: number;
  originalHeadline: string;
  suggestedHeadline: string;
  originalText: string;
  suggestedText: string;
  reasoning?: string | null;
  createdAt: Date;
}

export interface FacebookLaunch {
  id: number;
  adDraftId: number;
  campaignId: string;
  adsetId: string;
  adId: string;
  creativeId: string;
  imageHash?: string | null;
  launchStatus: "Pending" | "Success" | "Failed";
  errorMessage?: string | null;
  launchedAt: Date;
  updatedAt: Date;
}

export interface SettingsStatus {
  notion: {
    connected: boolean;
    hasToken: boolean;
    hasDatabaseId: boolean;
  };
  facebook: {
    connected: boolean;
    hasToken: boolean;
    hasAdAccountId: boolean;
  };
}
