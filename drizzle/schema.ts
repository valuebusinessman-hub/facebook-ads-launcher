import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Ad drafts pulled from Notion database.
 * Stores headline, copy, images, and targeting information for review and approval.
 */
export const adDrafts = mysqlTable("ad_drafts", {
  id: int("id").autoincrement().primaryKey(),
  notionPageId: varchar("notionPageId", { length: 64 }).notNull().unique(),
  headline: text("headline").notNull(),
  primaryText: text("primaryText").notNull(),
  imageUrl: text("imageUrl"),
  imageHash: varchar("imageHash", { length: 255 }),
  targetingJson: json("targetingJson"),
  status: mysqlEnum("status", ["Pending Review", "Approved", "Rejected", "Launched", "Failed"]).default("Pending Review").notNull(),
  facebookAdId: varchar("facebookAdId", { length: 255 }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdDraft = typeof adDrafts.$inferSelect;
export type InsertAdDraft = typeof adDrafts.$inferInsert;

/**
 * LLM-generated copy improvement suggestions.
 * Stores original and suggested headlines/text with reasoning.
 */
export const llmSuggestions = mysqlTable("llm_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  adDraftId: int("adDraftId").notNull(),
  originalHeadline: text("originalHeadline").notNull(),
  suggestedHeadline: text("suggestedHeadline").notNull(),
  originalText: text("originalText").notNull(),
  suggestedText: text("suggestedText").notNull(),
  reasoning: text("reasoning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LLMSuggestion = typeof llmSuggestions.$inferSelect;
export type InsertLLMSuggestion = typeof llmSuggestions.$inferInsert;

/**
 * Facebook launch records.
 * Tracks campaign, ad set, ad, and creative IDs for each launched ad.
 */
export const facebookLaunches = mysqlTable("facebook_launches", {
  id: int("id").autoincrement().primaryKey(),
  adDraftId: int("adDraftId").notNull(),
  campaignId: varchar("campaignId", { length: 255 }).notNull(),
  adsetId: varchar("adsetId", { length: 255 }).notNull(),
  adId: varchar("adId", { length: 255 }).notNull(),
  creativeId: varchar("creativeId", { length: 255 }).notNull(),
  imageHash: varchar("imageHash", { length: 255 }),
  launchStatus: mysqlEnum("launchStatus", ["Pending", "Success", "Failed"]).default("Pending").notNull(),
  errorMessage: text("errorMessage"),
  launchedAt: timestamp("launchedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FacebookLaunch = typeof facebookLaunches.$inferSelect;
export type InsertFacebookLaunch = typeof facebookLaunches.$inferInsert;

/**
 * Encrypted settings for API credentials.
 * Stores Notion token, Facebook app credentials, and ad account ID.
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * Notion sync log for tracking sync history and errors.
 */
export const notionSyncLog = mysqlTable("notion_sync_log", {
  id: int("id").autoincrement().primaryKey(),
  syncStatus: mysqlEnum("syncStatus", ["Success", "Failed"]).notNull(),
  draftsFetched: int("draftsFetched").default(0),
  errorMessage: text("errorMessage"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

export type NotionSyncLog = typeof notionSyncLog.$inferSelect;
export type InsertNotionSyncLog = typeof notionSyncLog.$inferInsert;