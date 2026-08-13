import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "community-test-user",
    email: "community-test@example.com",
    name: "Community Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("community access and safety", () => {
  it("exposes the shared session cookie on logout", async () => {
    const calls: string[] = [];
    const ctx = createContext();
    ctx.res.clearCookie = (name: string) => calls.push(name);
    await appRouter.createCaller(ctx).auth.logout();
    expect(calls).toEqual([COOKIE_NAME]);
  });

  it("prevents a member from rating their own profile", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.community.ratings.upsert({ ratedUserId: 1, score: 5 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a missing discussion before creating a reply", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.community.replies.create({ postId: 999999, body: "This is a sufficiently detailed reply." })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("keeps category administration restricted to admins", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.community.admin.categories()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
