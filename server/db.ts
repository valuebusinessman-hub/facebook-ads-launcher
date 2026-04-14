import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, adDrafts, InsertAdDraft, AdDraft, llmSuggestions, InsertLLMSuggestion, facebookLaunches, InsertFacebookLaunch, settings, InsertSetting, notionSyncLog, InsertNotionSyncLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Ad Draft queries
export async function getAdDraftsByStatus(status: string): Promise<AdDraft[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adDrafts).where(eq(adDrafts.status, status as any));
}

export async function getAllAdDrafts(): Promise<AdDraft[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adDrafts).orderBy(desc(adDrafts.createdAt));
}

export async function getAdDraftById(id: number): Promise<AdDraft | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adDrafts).where(eq(adDrafts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAdDraftByNotionPageId(notionPageId: string): Promise<AdDraft | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adDrafts).where(eq(adDrafts.notionPageId, notionPageId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAdDraft(draft: InsertAdDraft): Promise<AdDraft> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adDrafts).values(draft);
  const result = await db.select().from(adDrafts).where(eq(adDrafts.notionPageId, draft.notionPageId)).limit(1);
  return result[0];
}

export async function updateAdDraftStatus(id: number, status: string, facebookAdId?: string, errorMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(adDrafts).set({
    status: status as any,
    facebookAdId: facebookAdId || null,
    errorMessage: errorMessage || null,
    updatedAt: new Date(),
  }).where(eq(adDrafts.id, id));
}

// LLM Suggestion queries
export async function saveLLMSuggestions(suggestion: InsertLLMSuggestion): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(llmSuggestions).values(suggestion);
}

export async function getLLMSuggestionByAdDraftId(adDraftId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(llmSuggestions).where(eq(llmSuggestions.adDraftId, adDraftId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Facebook Launch queries
export async function recordFacebookLaunch(launch: InsertFacebookLaunch): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(facebookLaunches).values(launch);
}

export async function getFacebookLaunchByAdDraftId(adDraftId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(facebookLaunches).where(eq(facebookLaunches.adDraftId, adDraftId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Settings queries
export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result.length > 0 ? result[0].value : undefined;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getSetting(key);
  if (existing) {
    await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

// Notion Sync Log queries
export async function logNotionSync(log: InsertNotionSyncLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notionSyncLog).values(log);
}
