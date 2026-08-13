import { createHash, randomBytes } from "node:crypto";
import { ENV } from "./_core/env";
import { issueEmailLoginToken } from "./db";

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const COMMUNITY_FRONTEND_URL = "https://jennymahmuda.github.io/Smartgen-Platform-Community/";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashEmailLoginToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createEmailUserOpenId(email: string) {
  return `email:${createHash("sha256").update(email).digest("hex").slice(0, 56)}`;
}

export function getEmailDisplayName(email: string) {
  const localPart = email.split("@")[0] || "SmartGen member";
  return localPart.replace(/[._-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()).slice(0, 120);
}

export async function requestMagicLink(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!EMAIL_PATTERN.test(email) || email.length > 320) {
    throw new Error("Enter a valid email address");
  }
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    throw new Error("Email login is not configured yet");
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashEmailLoginToken(rawToken);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);
  const stored = await issueEmailLoginToken({ email, tokenHash, expiresAt });
  if (!stored) throw new Error("Email login is temporarily unavailable");

  const verifyUrl = new URL("/api/email/verify", ENV.publicBackendUrl || "https://smartgencom-3rtmgxsf.manus.space");
  verifyUrl.searchParams.set("token", rawToken);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${ENV.resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.resendFromEmail,
      to: [email],
      subject: "Your SmartGen Community sign-in link",
      text: `Use this one-time link to sign in to SmartGen Community: ${verifyUrl.toString()}\n\nThis link expires in 15 minutes and can only be used once.`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#101828;max-width:560px"><h2 style="color:#4f46e5">Sign in to SmartGen Community</h2><p>Use the button below to continue securely. This link expires in 15 minutes and can only be used once.</p><p><a href="${verifyUrl.toString()}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Continue to SmartGen Community</a></p><p style="font-size:12px;color:#667085">If you did not request this email, you can safely ignore it.</p></div>`,
    }),
  });

  if (!response.ok) {
    console.warn(`[EmailAuth] Resend rejected magic-link delivery with status ${response.status}`);
    throw new Error("Unable to send the sign-in email");
  }

  return { success: true } as const;
}
