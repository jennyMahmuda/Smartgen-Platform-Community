import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  CommunityCategory,
  InsertUser,
  communityBadges,
  communityCategories,
  communityPosts,
  communityPostViews,
  communityReplies,
  communityReactions,
  communityUserBadges,
  communityUserStats,
  contributorRatings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
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
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getCommunityCategories() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: communityCategories.id,
      slug: communityCategories.slug,
      name: communityCategories.name,
      description: communityCategories.description,
      icon: communityCategories.icon,
      sortOrder: communityCategories.sortOrder,
      postCount: sql<number>`count(${communityPosts.id})`,
    })
    .from(communityCategories)
    .leftJoin(communityPosts, eq(communityPosts.categoryId, communityCategories.id))
    .groupBy(
      communityCategories.id,
      communityCategories.slug,
      communityCategories.name,
      communityCategories.description,
      communityCategories.icon,
    )
    .orderBy(asc(communityCategories.sortOrder), asc(communityCategories.id));
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(communityCategories)
    .where(eq(communityCategories.id, id))
    .limit(1);
  return result[0];
}

export async function createCommunityCategory(input: {
  slug: string;
  name: string;
  description: string;
  icon?: string | null;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(communityCategories).values({
    ...input,
    sortOrder: input.sortOrder ?? 0,
  });
  return Number(result[0].insertId);
}

export async function reorderCommunityCategories(categoryIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.transaction(async tx => {
    for (let index = 0; index < categoryIds.length; index += 1) {
      await tx.update(communityCategories).set({ sortOrder: index }).where(eq(communityCategories.id, categoryIds[index]));
    }
  });
  return { success: true } as const;
}

export async function getRecentCommunityPosts(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const where = categoryId ? eq(communityPosts.categoryId, categoryId) : undefined;
  return db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      body: communityPosts.body,
      viewCount: communityPosts.viewCount,
      reactionCount: communityPosts.reactionCount,
      replyCount: communityPosts.replyCount,
      acceptedReplyId: communityPosts.acceptedReplyId,
      createdAt: communityPosts.createdAt,
      updatedAt: communityPosts.updatedAt,
      categoryId: communityCategories.id,
      categoryName: communityCategories.name,
      categorySlug: communityCategories.slug,
      authorId: users.id,
      authorName: users.name,
      authorOpenId: users.openId,
    })
    .from(communityPosts)
    .innerJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
    .innerJoin(users, eq(communityPosts.authorId, users.id))
    .where(where)
    .orderBy(desc(communityPosts.updatedAt))
    .limit(30);
}

export async function getCommunityPost(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const posts = await db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      body: communityPosts.body,
      viewCount: communityPosts.viewCount,
      reactionCount: communityPosts.reactionCount,
      replyCount: communityPosts.replyCount,
      acceptedReplyId: communityPosts.acceptedReplyId,
      createdAt: communityPosts.createdAt,
      updatedAt: communityPosts.updatedAt,
      categoryId: communityCategories.id,
      categoryName: communityCategories.name,
      categorySlug: communityCategories.slug,
      authorId: users.id,
      authorName: users.name,
      authorOpenId: users.openId,
    })
    .from(communityPosts)
    .innerJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
    .innerJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.id, id))
    .limit(1);
  if (!posts[0]) return undefined;

  const replies = await db
    .select({
      id: communityReplies.id,
      body: communityReplies.body,
      isAccepted: communityReplies.isAccepted,
      reactionCount: communityReplies.reactionCount,
      createdAt: communityReplies.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorOpenId: users.openId,
    })
    .from(communityReplies)
    .innerJoin(users, eq(communityReplies.authorId, users.id))
    .where(eq(communityReplies.postId, id))
    .orderBy(communityReplies.isAccepted, communityReplies.createdAt);

  const authorIds = Array.from(new Set([posts[0].authorId, ...replies.map(reply => reply.authorId)]));
  const ratingRows = authorIds.length
    ? await db.select({ userId: communityUserStats.userId, ratingScore: communityUserStats.ratingScore, ratingCount: communityUserStats.ratingCount }).from(communityUserStats).where(inArray(communityUserStats.userId, authorIds))
    : [];
  const ratings = new Map(ratingRows.map(row => [row.userId, row]));
  const ratingFor = (userId: number) => ({
    authorRatingScore: ratings.get(userId)?.ratingScore ?? 0,
    authorRatingCount: ratings.get(userId)?.ratingCount ?? 0,
  });

  return {
    ...posts[0],
    ...ratingFor(posts[0].authorId),
    replies: replies.map(reply => ({ ...reply, ...ratingFor(reply.authorId) })),
  };
}

export async function incrementPostView(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(communityPosts)
    .set({ viewCount: sql`${communityPosts.viewCount} + 1` })
    .where(eq(communityPosts.id, id));
}

export async function createCommunityPost(input: {
  categoryId: number;
  authorId: number;
  title: string;
  body: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(communityPosts).values(input);
  return Number(result[0].insertId);
}

export async function createCommunityReply(input: {
  postId: number;
  authorId: number;
  body: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(communityReplies).values(input);
  await db
    .update(communityPosts)
    .set({ replyCount: sql`${communityPosts.replyCount} + 1` })
    .where(eq(communityPosts.id, input.postId));
  return Number(result[0].insertId);
}

export async function incrementUserStat(userId: number, field: "problemsFaced" | "problemsResolved" | "solutionsProvided") {
  const db = await getDb();
  if (!db) return;
  const values = { userId, [field]: 1 } as { userId: number; problemsFaced?: number; problemsResolved?: number; solutionsProvided?: number };
  await db
    .insert(communityUserStats)
    .values(values)
    .onDuplicateKeyUpdate({ set: { [field]: sql`${communityUserStats[field]} + 1`, updatedAt: new Date() } });
}

export async function markCommunityReplyAccepted(replyId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select({ authorId: communityReplies.authorId, isAccepted: communityReplies.isAccepted }).from(communityReplies).where(eq(communityReplies.id, replyId)).limit(1);
  await db.update(communityReplies).set({ isAccepted: 0 }).where(eq(communityReplies.postId, postId));
  await db.update(communityReplies).set({ isAccepted: 1 }).where(eq(communityReplies.id, replyId));
  await db.update(communityPosts).set({ acceptedReplyId: replyId }).where(eq(communityPosts.id, postId));
  if (current[0] && !current[0].isAccepted) await incrementUserStat(current[0].authorId, "solutionsProvided");
}

export async function recordPostView(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select({ id: communityPostViews.id })
    .from(communityPostViews)
    .where(and(eq(communityPostViews.userId, userId), eq(communityPostViews.postId, postId)))
    .limit(1);
  if (existing[0]) return;
  await db.insert(communityPostViews).values({ userId, postId });
  await db
    .insert(communityUserStats)
    .values({ userId, articlesViewed: 1 })
    .onDuplicateKeyUpdate({ set: { articlesViewed: sql`${communityUserStats.articlesViewed} + 1`, updatedAt: new Date() } });
  await incrementPostView(postId);
}

export async function toggleCommunityReaction(input: {
  userId: number;
  targetType: "post" | "reply";
  targetId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const where = and(
    eq(communityReactions.userId, input.userId),
    eq(communityReactions.targetType, input.targetType),
    eq(communityReactions.targetId, input.targetId),
  );
  const existing = await db.select({ id: communityReactions.id }).from(communityReactions).where(where).limit(1);
  const table = input.targetType === "post" ? communityPosts : communityReplies;
  const idColumn = input.targetType === "post" ? communityPosts.id : communityReplies.id;
  const countColumn = input.targetType === "post" ? communityPosts.reactionCount : communityReplies.reactionCount;

  if (existing[0]) {
    await db.delete(communityReactions).where(eq(communityReactions.id, existing[0].id));
    await db.update(table).set({ reactionCount: sql`${countColumn} - 1` }).where(eq(idColumn, input.targetId));
    await db
      .update(communityUserStats)
      .set({ reactionsGiven: sql`greatest(${communityUserStats.reactionsGiven} - 1, 0)`, updatedAt: new Date() })
      .where(eq(communityUserStats.userId, input.userId));
    return { reacted: false };
  }

  await db.insert(communityReactions).values(input);
  await db.update(table).set({ reactionCount: sql`${countColumn} + 1` }).where(eq(idColumn, input.targetId));
  await db
    .insert(communityUserStats)
    .values({ userId: input.userId, reactionsGiven: 1 })
    .onDuplicateKeyUpdate({ set: { reactionsGiven: sql`${communityUserStats.reactionsGiven} + 1`, updatedAt: new Date() } });
  return { reacted: true };
}

export async function getReactionState(userId: number, targetType: "post" | "reply", targetId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: communityReactions.id })
    .from(communityReactions)
    .where(and(eq(communityReactions.userId, userId), eq(communityReactions.targetType, targetType), eq(communityReactions.targetId, targetId)))
    .limit(1);
  return Boolean(result[0]);
}

export async function getTopContributors(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: users.id,
      name: users.name,
      openId: users.openId,
      ratingScore: communityUserStats.ratingScore,
      ratingCount: communityUserStats.ratingCount,
      solutionsProvided: communityUserStats.solutionsProvided,
      problemsResolved: communityUserStats.problemsResolved,
    })
    .from(communityUserStats)
    .innerJoin(users, eq(communityUserStats.userId, users.id))
    .orderBy(desc(communityUserStats.ratingScore), desc(communityUserStats.solutionsProvided))
    .limit(limit);
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return { userId, articlesViewed: 0, reactionsGiven: 0, solutionsProvided: 0, problemsFaced: 0, problemsResolved: 0, ratingScore: 0, ratingCount: 0 };
  const result = await db.select().from(communityUserStats).where(eq(communityUserStats.userId, userId)).limit(1);
  return result[0] ?? { userId, articlesViewed: 0, reactionsGiven: 0, solutionsProvided: 0, problemsFaced: 0, problemsResolved: 0, ratingScore: 0, ratingCount: 0 };
}

export async function getCommunityProfile(userId: number) {
  const user = await getUserById(userId);
  if (!user) return undefined;
  const db = await getDb();
  const stats = await getUserStats(userId);
  const badges = db
    ? await db
        .select({ slug: communityBadges.slug, name: communityBadges.name, description: communityBadges.description, icon: communityBadges.icon })
        .from(communityUserBadges)
        .innerJoin(communityBadges, eq(communityUserBadges.badgeId, communityBadges.id))
        .where(eq(communityUserBadges.userId, userId))
    : [];
  return { user, stats, badges };
}

export async function upsertContributorRating(input: { raterId: number; ratedUserId: number; score: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(contributorRatings)
    .values(input)
    .onDuplicateKeyUpdate({ set: { score: input.score, updatedAt: new Date() } });
  const aggregate = await db
    .select({ count: sql<number>`count(*)`, average: sql<number>`avg(${contributorRatings.score})` })
    .from(contributorRatings)
    .where(eq(contributorRatings.ratedUserId, input.ratedUserId));
  const count = Number(aggregate[0]?.count ?? 0);
  const average = Number(aggregate[0]?.average ?? 0);
  await db
    .insert(communityUserStats)
    .values({ userId: input.ratedUserId, ratingScore: Math.round(average * 10), ratingCount: count })
    .onDuplicateKeyUpdate({ set: { ratingScore: Math.round(average * 10), ratingCount: count, updatedAt: new Date() } });
  return { ratingScore: Math.round(average * 10), ratingCount: count };
}

export async function getContributorRating(raterId: number, ratedUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(contributorRatings)
    .where(and(eq(contributorRatings.raterId, raterId), eq(contributorRatings.ratedUserId, ratedUserId)))
    .limit(1);
  return result[0];
}
