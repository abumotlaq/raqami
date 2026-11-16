import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { revokedTokens, users, type User } from "../db/schema.js";
import { errors } from "../lib/errors.js";
import { verifyAuthToken, type AuthToken } from "../lib/tokens.js";

interface AuthContext {
  user: User;
  token: AuthToken;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

// Requires a valid, non-revoked Bearer token. Answers 401 otherwise.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const [scheme, rawToken] = (req.get("authorization") ?? "").split(" ");
  const token = scheme === "Bearer" && rawToken ? verifyAuthToken(rawToken) : null;
  if (!token) throw errors.unauthenticated();

  const [revoked] = await db
    .select()
    .from(revokedTokens)
    .where(eq(revokedTokens.jti, token.jti))
    .limit(1);
  const [user] = await db.select().from(users).where(eq(users.id, token.userId)).limit(1);
  if (revoked || !user) throw errors.unauthenticated();

  req.auth = { user, token };
  next();
}

// Use after requireAuth. Answers 403 ADMIN_ONLY for non-admins.
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (authOf(req).user.role !== "admin") throw errors.adminOnly();
  next();
}

export function authOf(req: Request): AuthContext {
  if (!req.auth) throw errors.unauthenticated();
  return req.auth;
}
