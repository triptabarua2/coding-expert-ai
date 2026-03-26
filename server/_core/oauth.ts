import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

export function registerOAuthRoutes(app: Express) {
  app.use(
    session({
      secret: ENV.cookieSecret || "oauth-handshake-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 10 * 60 * 1000 },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  if (ENV.googleClientId && ENV.googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: ENV.googleClientId,
          clientSecret: ENV.googleClientSecret,
          callbackURL: "/api/oauth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const openId = `google:${profile.id}`;
            const email = profile.emails?.[0]?.value ?? null;
            const name = profile.displayName || null;
            await db.upsertUser({ openId, name, email, loginMethod: "google", lastSignedIn: new Date() });
            done(null, { openId, name: name || "" });
          } catch (err) {
            done(err as Error);
          }
        }
      )
    );

    app.get("/api/oauth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    app.get(
      "/api/oauth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login?error=google" }),
      async (req: Request, res: Response) => issueSessionAndRedirect(req, res)
    );
  }

  if (ENV.githubClientId && ENV.githubClientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: ENV.githubClientId,
          clientSecret: ENV.githubClientSecret,
          callbackURL: "/api/oauth/github/callback",
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const openId = `github:${profile.id}`;
            const email = profile.emails?.[0]?.value ?? null;
            const name = profile.displayName || profile.username || null;
            await db.upsertUser({ openId, name, email, loginMethod: "github", lastSignedIn: new Date() });
            done(null, { openId, name: name || "" });
          } catch (err) {
            done(err as Error);
          }
        }
      )
    );

    app.get("/api/oauth/github", passport.authenticate("github", { scope: ["user:email"] }));
    app.get(
      "/api/oauth/github/callback",
      passport.authenticate("github", { failureRedirect: "/login?error=github" }),
      async (req: Request, res: Response) => issueSessionAndRedirect(req, res)
    );
  }

  if (ENV.oAuthServerUrl) {
    app.get("/api/oauth/callback", async (req: Request, res: Response) => {
      const code = typeof req.query.code === "string" ? req.query.code : undefined;
      const state = typeof req.query.state === "string" ? req.query.state : undefined;

      if (!code || !state) {
        res.status(400).json({ error: "code and state are required" });
        return;
      }

      try {
        const tokenResponse = await sdk.exchangeCodeForToken(code, state);
        const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

        if (!userInfo.openId) {
          res.status(400).json({ error: "openId missing from user info" });
          return;
        }

        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(userInfo.openId, {
          name: userInfo.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/");
      } catch (error) {
        console.error("[OAuth] Manus callback failed", error);
        res.status(500).json({ error: "OAuth callback failed" });
      }
    });
  }
}

async function issueSessionAndRedirect(req: Request, res: Response) {
  const user = req.user as { openId: string; name: string } | undefined;
  if (!user) {
    res.redirect("/login?error=no_user");
    return;
  }
  try {
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name,
      expiresInMs: ONE_YEAR_MS,
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  } catch (err) {
    console.error("[OAuth] Session issue failed", err);
    res.redirect("/login?error=session");
  }
}
