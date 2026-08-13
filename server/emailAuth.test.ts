import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { requestMagicLink, normalizeEmail, hashEmailLoginToken } from "./emailAuth";

const issueToken = vi.hoisted(() => vi.fn(async () => true));
vi.mock("./db", () => ({ issueEmailLoginToken: issueToken }));

describe("email magic-link auth", () => {
  afterEach(() => {
    ENV.resendApiKey = "";
    ENV.resendFromEmail = "";
    ENV.publicBackendUrl = "https://smartgencom-3rtmgxsf.manus.space";
    issueToken.mockClear();
    vi.restoreAllMocks();
  });

  it("normalizes addresses and hashes tokens without returning the raw value", () => {
    expect(normalizeEmail("  Builder@Example.COM ")).toBe("builder@example.com");
    expect(hashEmailLoginToken("token")).toHaveLength(64);
    expect(hashEmailLoginToken("token")).not.toBe("token");
  });

  it("stores a hashed token and sends a Resend message containing the verification URL", async () => {
    ENV.resendApiKey = "re_test_key";
    ENV.resendFromEmail = "SmartGen Community <support@example.com>";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "email-id" }), { status: 200 }));

    await expect(requestMagicLink(" Builder@Example.COM ")).resolves.toEqual({ success: true });
    expect(issueToken).toHaveBeenCalledTimes(1);
    const stored = issueToken.mock.calls[0][0];
    expect(stored.email).toBe("builder@example.com");
    expect(stored.tokenHash).toHaveLength(64);
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(requestBody.to).toEqual(["builder@example.com"]);
    expect(requestBody.text).toContain("https://smartgencom-3rtmgxsf.manus.space/api/email/verify?token=");
    expect(requestBody.text).not.toContain(stored.tokenHash);
  });

  it("returns a user-safe error when Resend rejects the request", async () => {
    ENV.resendApiKey = "re_test_key";
    ENV.resendFromEmail = "SmartGen Community <support@example.com>";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("invalid sender", { status: 422 }));

    await expect(requestMagicLink("builder@example.com")).rejects.toThrow("Unable to send the sign-in email");
  });
});
