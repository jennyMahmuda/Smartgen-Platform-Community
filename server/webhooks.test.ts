import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { createSolutionAcceptedEvent, deliverSolutionAcceptedWebhook } from "./webhooks";

describe("accepted-solution webhooks", () => {
  afterEach(() => {
    ENV.communityWebhookUrl = "";
    ENV.communityWebhookSecret = "";
    vi.restoreAllMocks();
  });

  it("fails closed when the webhook URL is missing or not HTTPS", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    ENV.communityWebhookUrl = "http://localhost:8787/hook";
    ENV.communityWebhookSecret = "test-secret";
    const event = createSolutionAcceptedEvent({ postId: 7, title: "A discussion", categorySlug: "support", postAuthorId: 1, replyId: 9, replyAuthorId: 2 });
    await expect(deliverSolutionAcceptedWebhook(event)).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts a signed event and returns true for a successful receiver", async () => {
    ENV.communityWebhookUrl = "https://hooks.example.test/smartgen";
    ENV.communityWebhookSecret = "test-secret";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    const event = createSolutionAcceptedEvent({ postId: 7, title: "A discussion", categorySlug: "support", postAuthorId: 1, replyId: 9, replyAuthorId: 2 });

    await expect(deliverSolutionAcceptedWebhook(event)).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, request] = fetchSpy.mock.calls[0];
    const body = String(request?.body);
    const expectedSignature = `sha256=${createHmac("sha256", "test-secret").update(body).digest("hex")}`;
    expect(String(url)).toBe("https://hooks.example.test/smartgen");
    expect(request?.method).toBe("POST");
    const headers = request?.headers as Record<string, string>;
    expect(headers["x-smartgen-event"]).toBe("community.solution.accepted");
    expect(headers["x-smartgen-signature"]).toBe(expectedSignature);
  });

  it("returns false when the receiver rejects the event", async () => {
    ENV.communityWebhookUrl = "https://hooks.example.test/smartgen";
    ENV.communityWebhookSecret = "test-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("unavailable", { status: 503 }));
    const event = createSolutionAcceptedEvent({ postId: 7, title: "A discussion", categorySlug: "support", postAuthorId: 1, replyId: 9, replyAuthorId: 2 });
    await expect(deliverSolutionAcceptedWebhook(event)).resolves.toBe(false);
  });
});
