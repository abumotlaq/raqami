import bcrypt from "bcryptjs";
import { eq, lt } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { revokedTokens, users } from "../db/schema.js";
import { errors } from "../lib/errors.js";
import { toUser } from "../lib/serialize.js";
import { signAuthToken } from "../lib/tokens.js";
import { parse } from "../lib/validate.js";
import { authOf, requireAuth } from "../middleware/auth.js";

const email = z
  .string("البريد الإلكتروني مطلوب.")
  .trim()
  .toLowerCase()
  .pipe(z.email("صيغة البريد الإلكتروني غير صحيحة."));

const registerBody = z.object({
  name: z
    .string("الاسم مطلوب.")
    .trim()
    .min(2, "الاسم يجب أن يتكون من حرفين على الأقل.")
    .max(100, "الاسم طويل جدًا."),
  email,
  password: z
    .string("كلمة المرور مطلوبة.")
    .min(8, "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.")
    // bcrypt only reads the first 72 bytes of a password.
    .refine((value) => Buffer.byteLength(value) <= 72, "كلمة المرور طويلة جدًا."),
});

const loginBody = z.object({
  email,
  password: z.string("كلمة المرور مطلوبة.").min(1, "كلمة المرور مطلوبة."),
});

// Compared against when the email is unknown, so both cases take the same time.
const dummyHash = bcrypt.hashSync("no-such-user", 10);

export const authRouter = Router();

// POST /auth/register — create an account (UC-04).
authRouter.post("/register", async (req, res) => {
  const body = parse(registerBody, req.body);

  const [user] = await db
    .insert(users)
    .values({
      name: body.name,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 10),
    })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (!user) throw errors.emailTaken();

  res.status(201).json({ user: toUser(user), token: signAuthToken(user.id) });
});

// POST /auth/login — sign in (UC-05).
authRouter.post("/login", async (req, res) => {
  const body = parse(loginBody, req.body);

  const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
  const passwordOk = await bcrypt.compare(body.password, user?.passwordHash ?? dummyHash);
  if (!user || !passwordOk) throw errors.invalidCredentials();

  res.json({ user: toUser(user), token: signAuthToken(user.id) });
});

// POST /auth/logout — invalidate the current token.
authRouter.post("/logout", requireAuth, async (req, res) => {
  const { token } = authOf(req);
  await db
    .insert(revokedTokens)
    .values({ jti: token.jti, expiresAt: token.expiresAt })
    .onConflictDoNothing();
  // Tokens that have expired no longer need to be remembered.
  await db.delete(revokedTokens).where(lt(revokedTokens.expiresAt, new Date()));

  res.status(204).end();
});

// GET /auth/me — the signed-in user.
authRouter.get("/me", requireAuth, (req, res) => {
  res.json(toUser(authOf(req).user));
});
