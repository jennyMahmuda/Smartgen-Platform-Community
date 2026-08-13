import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { consumeEmailLoginToken, ensureEmailUser } from "./db";
import {
  COMMUNITY_FRONTEND_URL,
  createEmailUserOpenId,
  getEmailDisplayName,
  hashEmailLoginToken,
} from "./emailAuth";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

export function registerEmailAuthRoutes(app: Express) {
  app.get("/api/email/verify", async (req: Request, res: Response) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      res.status(400).send("This sign-in link is missing its token.");
      return;
    }

    try {
      const tokenRecord = await consumeEmailLoginToken(hashEmailLoginToken(token));
      if (!tokenRecord) {
        res.status(400).send("This sign-in link is invalid, expired, or already used.");
        return;
      }

      const user = await ensureEmailUser({
        email: tokenRecord.email,
        openId: createEmailUserOpenId(tokenRecord.email),
        name: getEmailDisplayName(tokenRecord.email),
      });
      if (!user) {
        res.status(503).send("We could not complete sign-in right now. Please request a new link.");
        return;
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || getEmailDisplayName(tokenRecord.email),
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.redirect(302, COMMUNITY_FRONTEND_URL);
    } catch (error) {
      console.error("[EmailAuth] Verification failed", error);
      res.status(500).send("We could not complete sign-in right now. Please request a new link.");
    }
  });
}
