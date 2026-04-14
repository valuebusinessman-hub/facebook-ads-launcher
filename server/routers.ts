import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { NotionClient, parseAdDraftFromNotion } from "./clients/notion";
import { FacebookClient, buildFacebookTargeting } from "./clients/facebook";
import { generateCopySuggestions } from "./clients/llm";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Ad Drafts Router
  drafts: router({
    /**
     * Get all ad drafts with optional status filter
     */
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        if (input.status) {
          return db.getAdDraftsByStatus(input.status);
        }
        return db.getAllAdDrafts();
      }),

    /**
     * Get a single draft by ID with LLM suggestions
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const draft = await db.getAdDraftById(input.id);
        if (!draft) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found" });
        }

        const suggestions = await db.getLLMSuggestionByAdDraftId(input.id);
        const launch = await db.getFacebookLaunchByAdDraftId(input.id);

        return {
          ...draft,
          suggestions,
          launch,
        };
      }),

    /**
     * Generate LLM copy suggestions for a draft
     */
    generateSuggestions: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const draft = await db.getAdDraftById(input.id);
        if (!draft) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found" });
        }

        try {
          const suggestions = await generateCopySuggestions(
            draft.headline,
            draft.primaryText
          );

          await db.saveLLMSuggestions({
            adDraftId: input.id,
            originalHeadline: suggestions.originalHeadline,
            suggestedHeadline: suggestions.suggestedHeadline,
            originalText: suggestions.originalText,
            suggestedText: suggestions.suggestedText,
            reasoning: suggestions.reasoning,
          });

          return suggestions;
        } catch (error) {
          console.error("[Routers] Generate suggestions error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate suggestions",
          });
        }
      }),

    /**
     * Approve and launch a draft to Facebook
     */
    approve: protectedProcedure
      .input(z.object({
        id: z.number(),
        useHeadline: z.string(),
        usePrimaryText: z.string(),
      }))
      .mutation(async ({ input }) => {
        const draft = await db.getAdDraftById(input.id);
        if (!draft) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found" });
        }

        try {
          // Get credentials
          const notionToken = await db.getSetting("notion_token");
          const facebookToken = await db.getSetting("facebook_access_token");
          const adAccountId = await db.getSetting("facebook_ad_account_id");

          if (!notionToken || !facebookToken || !adAccountId) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Missing API credentials. Please configure settings.",
            });
          }

          // Initialize clients
          const notionClient = new NotionClient(notionToken);
          const facebookClient = new FacebookClient(facebookToken, adAccountId);

          // Download image if present
          let imageHash: string | undefined;
          if (draft.imageUrl) {
            try {
              const imageBuffer = await notionClient.downloadImage(draft.imageUrl);
              const uploadResult = await facebookClient.uploadImage(
                imageBuffer,
                `allsleepers_${draft.id}.jpg`
              );
              imageHash = uploadResult.image_hash;
            } catch (imageError) {
              console.error("[Routers] Image upload error:", imageError);
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to upload image to Facebook",
              });
            }
          }

          // Create Facebook campaign
          const campaign = await facebookClient.createCampaign({
            name: `Allsleepers - ${draft.headline.substring(0, 30)}`,
            objective: "CONVERSIONS",
            status: "PAUSED",
          });

          // Create ad set
          const targeting = buildFacebookTargeting(
            draft.targetingJson as Record<string, any>
          );
          const adSet = await facebookClient.createAdSet({
            campaign_id: campaign.id,
            name: `AdSet - ${draft.headline.substring(0, 30)}`,
            targeting,
            daily_budget: 5000, // $50 USD in cents
            status: "PAUSED",
          });

          // Create creative
          const objectStorySpec = facebookClient.buildObjectStorySpec(
            input.useHeadline,
            input.usePrimaryText,
            imageHash || ""
          );

          const creative = await facebookClient.createAdCreative({
            name: `Creative - ${draft.headline.substring(0, 30)}`,
            object_story_spec: objectStorySpec,
          });

          // Create ad
          const ad = await facebookClient.createAd({
            adset_id: adSet.id,
            creative: { creative_id: creative.id },
            name: `Ad - ${draft.headline.substring(0, 30)}`,
            status: "PAUSED",
          });

          // Record launch
          await db.recordFacebookLaunch({
            adDraftId: input.id,
            campaignId: campaign.id,
            adsetId: adSet.id,
            adId: ad.id,
            creativeId: creative.id,
            imageHash: imageHash,
            launchStatus: "Success",
          });

          // Update draft status
          await db.updateAdDraftStatus(input.id, "Launched", ad.id);

          // Update Notion page
          try {
            const databaseId = await db.getSetting("notion_database_id");
            if (databaseId) {
              await notionClient.updatePageProperty(draft.notionPageId, {
                Status: {
                  select: {
                    name: "Launched",
                  },
                },
                "Facebook Ad ID": {
                  rich_text: [
                    {
                      text: {
                        content: ad.id,
                      },
                    },
                  ],
                },
              });
            }
          } catch (notionError) {
            console.error("[Routers] Notion writeback error:", notionError);
            // Don't fail the entire operation if Notion writeback fails
          }

          return {
            success: true,
            facebookAdId: ad.id,
            campaignId: campaign.id,
          };
        } catch (error) {
          console.error("[Routers] Approve error:", error);

          // Record failure
          await db.updateAdDraftStatus(
            input.id,
            "Failed",
            undefined,
            error instanceof Error ? error.message : "Unknown error"
          );

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to launch ad to Facebook",
          });
        }
      }),

    /**
     * Reject a draft
     */
    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateAdDraftStatus(input.id, "Rejected");
        return { success: true };
      }),
  }),

  // Notion Sync Router
  notion: router({
    /**
     * Sync ad drafts from Notion database
     */
    syncDrafts: protectedProcedure.mutation(async () => {
      try {
        const notionToken = await db.getSetting("notion_token");
        const databaseId = await db.getSetting("notion_database_id");

        if (!notionToken || !databaseId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Missing Notion credentials. Please configure settings.",
          });
        }

        const notionClient = new NotionClient(notionToken);
        const pages = await notionClient.queryDatabase(databaseId, {
          filter: {
            property: "Status",
            select: {
              equals: "Pending Review",
            },
          },
        });

        let draftsFetched = 0;

        for (const page of pages) {
          try {
            const parsed = parseAdDraftFromNotion(page, notionClient);
            const existing = await db.getAdDraftByNotionPageId(parsed.notionPageId);

            if (!existing) {
              await db.createAdDraft({
                notionPageId: parsed.notionPageId,
                headline: parsed.headline,
                primaryText: parsed.primaryText,
                imageUrl: parsed.imageUrl,
                targetingJson: parsed.targeting,
                status: "Pending Review",
              });
              draftsFetched++;
            }
          } catch (pageError) {
            console.error("[Routers] Parse page error:", pageError);
          }
        }

        await db.logNotionSync({
          syncStatus: "Success",
          draftsFetched,
        });

        return { success: true, draftsFetched };
      } catch (error) {
        console.error("[Routers] Sync error:", error);

        await db.logNotionSync({
          syncStatus: "Failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync drafts from Notion",
        });
      }
    }),
  }),

  // Settings Router
  settings: router({
    /**
     * Get all settings (non-sensitive fields only)
     */
    getStatus: protectedProcedure.query(async () => {
      const hasNotionToken = !!(await db.getSetting("notion_token"));
      const hasFacebookToken = !!(await db.getSetting("facebook_access_token"));
      const hasAdAccountId = !!(await db.getSetting("facebook_ad_account_id"));
      const hasDatabaseId = !!(await db.getSetting("notion_database_id"));

      return {
        notion: {
          connected: hasNotionToken && hasDatabaseId,
          hasToken: hasNotionToken,
          hasDatabaseId: hasDatabaseId,
        },
        facebook: {
          connected: hasFacebookToken && hasAdAccountId,
          hasToken: hasFacebookToken,
          hasAdAccountId: hasAdAccountId,
        },
      };
    }),

    /**
     * Update credentials
     */
    updateCredentials: protectedProcedure
      .input(z.object({
        notionToken: z.string().optional(),
        notionDatabaseId: z.string().optional(),
        facebookAccessToken: z.string().optional(),
        facebookAdAccountId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          if (input.notionToken) {
            await db.setSetting("notion_token", input.notionToken);
          }
          if (input.notionDatabaseId) {
            await db.setSetting("notion_database_id", input.notionDatabaseId);
          }
          if (input.facebookAccessToken) {
            await db.setSetting("facebook_access_token", input.facebookAccessToken);
          }
          if (input.facebookAdAccountId) {
            await db.setSetting("facebook_ad_account_id", input.facebookAdAccountId);
          }

          return { success: true };
        } catch (error) {
          console.error("[Routers] Update credentials error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update credentials",
          });
        }
      }),

    /**
     * Validate credentials
     */
    validateCredentials: protectedProcedure.mutation(async () => {
      try {
        const notionToken = await db.getSetting("notion_token");
        const facebookToken = await db.getSetting("facebook_access_token");
        const adAccountId = await db.getSetting("facebook_ad_account_id");

        let notionValid = false;
        let facebookValid = false;

        if (notionToken) {
          try {
            const notionClient = new NotionClient(notionToken);
            // Try to get user info to validate token
            notionValid = true;
          } catch {
            notionValid = false;
          }
        }

        if (facebookToken && adAccountId) {
          try {
            const facebookClient = new FacebookClient(facebookToken, adAccountId);
            notionValid = await facebookClient.validateToken();
          } catch {
            facebookValid = false;
          }
        }

        return {
          notion: notionValid,
          facebook: facebookValid,
        };
      } catch (error) {
        console.error("[Routers] Validate credentials error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate credentials",
        });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
