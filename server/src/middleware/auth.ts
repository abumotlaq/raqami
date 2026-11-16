import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, type User } from "../db/schema.js";
import { errors } from "../lib/errors.js";
import { verifyAuthToken } from "../lib/tokens.js";

interface AuthContext {
  user: User;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

// Requires a valid Bearer token that was not invalidated by logout. Answers 401 otherwise.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const [scheme, rawToken] = (req.get("authorization") ?? "").split(" ");
  const token = scheme === "Bearer" && rawToken ? verifyAuthToken(rawToken) : null;
  if (!token) throw errors.unauthenticated();

  const [user] = await db.select().from(users).where(eq(users.id, token.userId)).limit(1);
  if (!user || user.tokenVersion !== token.version) throw errors.unauthenticated();

  req.auth = { user };
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
