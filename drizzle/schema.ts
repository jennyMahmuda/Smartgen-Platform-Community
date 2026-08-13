import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const communityCategories = mysqlTable(
  "community_categories",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    icon: varchar("icon", { length: 40 }),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("community_categories_slug_unique").on(table.slug),
  }),
);

export const communityPosts = mysqlTable(
  "community_posts",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").notNull(),
    authorId: int("authorId").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    viewCount: int("viewCount").default(0).notNull(),
    reactionCount: int("reactionCount").default(0).notNull(),
    replyCount: int("replyCount").default(0).notNull(),
    acceptedReplyId: int("acceptedReplyId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    categoryIndex: index("community_posts_category_idx").on(table.categoryId),
    authorIndex: index("community_posts_author_idx").on(table.authorId),
    createdIndex: index("community_posts_created_idx").on(table.createdAt),
  }),
);

export const communityReplies = mysqlTable(
  "community_replies",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    authorId: int("authorId").notNull(),
    body: text("body").notNull(),
    isAccepted: int("isAccepted").default(0).notNull(),
    reactionCount: int("reactionCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    postIndex: index("community_replies_post_idx").on(table.postId),
    authorIndex: index("community_replies_author_idx").on(table.authorId),
  }),
);

export const communityPostViews = mysqlTable(
  "community_post_views",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    postId: int("postId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    uniqueView: uniqueIndex("community_post_views_unique").on(table.userId, table.postId),
    postIndex: index("community_post_views_post_idx").on(table.postId),
  }),
);

export const communityReactions = mysqlTable(
  "community_reactions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    targetType: mysqlEnum("targetType", ["post", "reply"]).notNull(),
    targetId: int("targetId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    uniqueReaction: uniqueIndex("community_reactions_unique").on(table.userId, table.targetType, table.targetId),
    targetIndex: index("community_reactions_target_idx").on(table.targetType, table.targetId),
  }),
);

export const contributorRatings = mysqlTable(
  "contributor_ratings",
  {
    id: int("id").autoincrement().primaryKey(),
    raterId: int("raterId").notNull(),
    ratedUserId: int("ratedUserId").notNull(),
    score: int("score").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    pairUnique: uniqueIndex("contributor_ratings_pair_unique").on(
      table.raterId,
      table.ratedUserId,
    ),
    ratedIndex: index("contributor_ratings_rated_idx").on(table.ratedUserId),
  }),
);

export const communityUserStats = mysqlTable("community_user_stats", {
  userId: int("userId").primaryKey(),
  articlesViewed: int("articlesViewed").default(0).notNull(),
  reactionsGiven: int("reactionsGiven").default(0).notNull(),
  solutionsProvided: int("solutionsProvided").default(0).notNull(),
  problemsFaced: int("problemsFaced").default(0).notNull(),
  problemsResolved: int("problemsResolved").default(0).notNull(),
  ratingScore: int("ratingScore").default(0).notNull(),
  ratingCount: int("ratingCount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const communityBadges = mysqlTable(
  "community_badges",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    icon: varchar("icon", { length: 40 }).notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("community_badges_slug_unique").on(table.slug),
  }),
);

export const communityUserBadges = mysqlTable(
  "community_user_badges",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    badgeId: int("badgeId").notNull(),
    awardedAt: timestamp("awardedAt").defaultNow().notNull(),
  },
  table => ({
    userBadgeUnique: uniqueIndex("community_user_badges_unique").on(
      table.userId,
      table.badgeId,
    ),
    userIndex: index("community_user_badges_user_idx").on(table.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CommunityCategory = typeof communityCategories.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityReply = typeof communityReplies.$inferSelect;
export type CommunityPostView = typeof communityPostViews.$inferSelect;
export type CommunityReaction = typeof communityReactions.$inferSelect;
export type ContributorRating = typeof contributorRatings.$inferSelect;
export type CommunityUserStats = typeof communityUserStats.$inferSelect;
export type CommunityBadge = typeof communityBadges.$inferSelect;
export type CommunityUserBadge = typeof communityUserBadges.$inferSelect;
