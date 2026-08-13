import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  createCommunityPost,
  createCommunityCategory,
  createCommunityReply,
  getCategoryById,
  getCommunityCategories,
  getCommunityPost,
  getCommunityProfile,
  getContributorRating,
  getReactionState,
  getRecentCommunityPosts,
  getTopContributors,
  incrementUserStat,
  markCommunityReplyAccepted,
  recordPostView,
  reorderCommunityCategories,
  toggleCommunityReaction,
  upsertContributorRating,
} from "./db";
import { getDb } from "./db";
import { communityPosts, communityReplies } from "../drizzle/schema";
import { createSolutionAcceptedEvent, deliverSolutionAcceptedWebhook } from "./webhooks";
import { eq } from "drizzle-orm";

const postListInput = z.object({ categoryId: z.number().int().positive().optional() }).optional();

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  community: router({
    categories: protectedProcedure.query(async () => getCommunityCategories()),

    admin: router({
      categories: adminProcedure.query(async () => getCommunityCategories()),
      createCategory: adminProcedure
        .input(z.object({
          slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only").min(2).max(80),
          name: z.string().trim().min(2).max(120),
          description: z.string().trim().min(10).max(500),
          icon: z.string().trim().max(40).optional(),
        }))
        .mutation(async ({ input }) => {
          const current = await getCommunityCategories();
          const slugExists = current.some(category => category.slug === input.slug);
          if (slugExists) throw new TRPCError({ code: "CONFLICT", message: "A category with this slug already exists" });
          const sortOrder = current.reduce((highest, category) => Math.max(highest, Number(category.sortOrder)), -1) + 1;
          return { id: await createCommunityCategory({ ...input, sortOrder }) };
        }),
      reorderCategories: adminProcedure
        .input(z.object({ categoryIds: z.array(z.number().int().positive()).min(1) }))
        .mutation(async ({ input }) => {
          const current = await getCommunityCategories();
          const currentIds = current.map(category => category.id).sort((a, b) => a - b);
          const submittedIds = Array.from(new Set(input.categoryIds)).sort((a, b) => a - b);
          if (currentIds.length !== submittedIds.length || currentIds.some((id, index) => id !== submittedIds[index])) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Submit every category exactly once when reordering" });
          }
          return reorderCommunityCategories(input.categoryIds);
        }),
    }),

    posts: router({
      list: protectedProcedure.input(postListInput).query(async ({ input }) => getRecentCommunityPosts(input?.categoryId)),
      get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
        const post = await getCommunityPost(input.id);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });
        await recordPostView(ctx.user.id, input.id);
        return { post, reacted: await getReactionState(ctx.user.id, "post", input.id) };
      }),
      create: protectedProcedure
        .input(z.object({ categoryId: z.number().int().positive(), title: z.string().trim().min(8).max(180), body: z.string().trim().min(20).max(12000) }))
        .mutation(async ({ input, ctx }) => {
          const category = await getCategoryById(input.categoryId);
          if (!category) throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
          const id = await createCommunityPost({ ...input, authorId: ctx.user.id });
          if (category.slug === "support") await incrementUserStat(ctx.user.id, "problemsFaced");
          return { id };
        }),
    }),

    replies: router({
      create: protectedProcedure
        .input(z.object({ postId: z.number().int().positive(), body: z.string().trim().min(10).max(8000) }))
        .mutation(async ({ input, ctx }) => {
          const post = await getCommunityPost(input.postId);
          if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });
          const id = await createCommunityReply({ ...input, authorId: ctx.user.id });
          return { id };
        }),
      accept: protectedProcedure
        .input(z.object({ postId: z.number().int().positive(), replyId: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const post = await getCommunityPost(input.postId);
          if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });
          if (post.authorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the discussion author can accept a solution" });
          const db = await getDb();
          const reply = db ? await db.select().from(communityReplies).where(eq(communityReplies.id, input.replyId)).limit(1) : [];
          if (!reply[0] || reply[0].postId !== input.postId) throw new TRPCError({ code: "BAD_REQUEST", message: "Reply does not belong to this discussion" });
          const newlyAccepted = post.acceptedReplyId !== input.replyId;
          let notificationDelivered = false;
          let webhookDelivered = false;
          await markCommunityReplyAccepted(input.replyId, input.postId);
          if (post.categorySlug === "support") await incrementUserStat(reply[0].authorId, "problemsResolved");
          if (newlyAccepted) {
            notificationDelivered = await notifyOwner({
              title: "SmartGen Community: solution accepted",
              content: `${post.authorName || "A member"} accepted a solution in “${post.title}”. The accepted reply was provided by ${reply[0].authorId === ctx.user.id ? (ctx.user.name || ctx.user.email || "a member") : `member #${reply[0].authorId}`}. Review the discussion in the community dashboard.`,
            });
            if (!notificationDelivered) console.warn(`[Community] Accepted-solution notification was not delivered for post ${input.postId}`);
            webhookDelivered = await deliverSolutionAcceptedWebhook(createSolutionAcceptedEvent({
              postId: input.postId,
              title: post.title,
              categorySlug: post.categorySlug,
              postAuthorId: post.authorId,
              replyId: input.replyId,
              replyAuthorId: reply[0].authorId,
            }));
          }
          return { success: true, notificationDelivered, webhookDelivered };
        }),
    }),

    reactions: router({
      toggle: protectedProcedure
        .input(z.object({ targetType: z.enum(["post", "reply"]), targetId: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
          const table = input.targetType === "post" ? communityPosts : communityReplies;
          const target = await db.select({ id: table.id }).from(table).where(eq(table.id, input.targetId)).limit(1);
          if (!target[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Reaction target not found" });
          return toggleCommunityReaction({ userId: ctx.user.id, ...input });
        }),
    }),

    profile: router({
      get: protectedProcedure.input(z.object({ userId: z.number().int().positive().optional() }).optional()).query(async ({ input, ctx }) => {
        const profile = await getCommunityProfile(input?.userId ?? ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        const ownRating = input?.userId && input.userId !== ctx.user.id ? await getContributorRating(ctx.user.id, input.userId) : undefined;
        return { ...profile, ownRating: ownRating?.score ?? null };
      }),
    }),

    ratings: router({
      upsert: protectedProcedure
        .input(z.object({ ratedUserId: z.number().int().positive(), score: z.number().int().min(1).max(5) }))
        .mutation(async ({ input, ctx }) => {
          if (input.ratedUserId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot rate your own profile" });
          const target = await getCommunityProfile(input.ratedUserId);
          if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Contributor not found" });
          return upsertContributorRating({ raterId: ctx.user.id, ...input });
        }),
    }),

    contributors: router({
      list: protectedProcedure.query(async () => getTopContributors()),
    }),
  }),
});

export type AppRouter = typeof appRouter;
