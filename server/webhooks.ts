import { createHmac } from "node:crypto";
import { ENV } from "./_core/env";

export type SolutionAcceptedEvent = {
  event: "community.solution.accepted";
  occurredAt: string;
  discussion: {
    id: number;
    title: string;
    categorySlug: string;
    authorId: number;
  };
  solution: {
    replyId: number;
    authorId: number;
  };
};

function signPayload(payload: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

export async function deliverSolutionAcceptedWebhook(event: SolutionAcceptedEvent): Promise<boolean> {
  if (!ENV.communityWebhookUrl || !ENV.communityWebhookSecret) return false;

  let endpoint: URL;
  try {
    endpoint = new URL(ENV.communityWebhookUrl);
    if (endpoint.protocol !== "https:") return false;
  } catch {
    return false;
  }

  const payload = JSON.stringify(event);
  const signature = signPayload(payload, ENV.communityWebhookSecret);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "SmartGen-Community/1.0",
        "x-smartgen-event": event.event,
        "x-smartgen-signature": signature,
      },
      body: payload,
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`[CommunityWebhook] Delivery failed with status ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[CommunityWebhook] Delivery failed:", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function createSolutionAcceptedEvent(input: {
  postId: number;
  title: string;
  categorySlug: string;
  postAuthorId: number;
  replyId: number;
  replyAuthorId: number;
}): SolutionAcceptedEvent {
  return {
    event: "community.solution.accepted",
    occurredAt: new Date().toISOString(),
    discussion: {
      id: input.postId,
      title: input.title,
      categorySlug: input.categorySlug,
      authorId: input.postAuthorId,
    },
    solution: {
      replyId: input.replyId,
      authorId: input.replyAuthorId,
    },
  };
}
