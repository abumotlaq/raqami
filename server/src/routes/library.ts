import fs from "node:fs";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { downloads, products } from "../db/schema.js";
import { env } from "../env.js";
import { errors } from "../lib/errors.js";
import { toProduct } from "../lib/serialize.js";
import { signDownload, verifyDownload } from "../lib/tokens.js";
import { parseId } from "../lib/validate.js";
import { authOf, requireAuth } from "../middleware/auth.js";

// The purchased product, or undefined if this user has no download right for it.
async function purchasedProduct(userId: number, productId: number) {
  const [row] = await db
    .select({ product: products })
    .from(downloads)
    .innerJoin(products, eq(products.id, downloads.productId))
    .where(and(eq(downloads.userId, userId), eq(downloads.productId, productId)))
    .limit(1);
  return row?.product;
}

export const libraryRouter = Router();
libraryRouter.use(requireAuth);

// GET /library — products the user has bought (UC-08).
// Products hidden from the store after purchase stay in the library.
libraryRouter.get("/", async (req, res) => {
  const rows = await db
    .select({ product: products, purchasedAt: downloads.createdAt })
    .from(downloads)
    .innerJoin(products, eq(products.id, downloads.productId))
    .where(eq(downloads.userId, authOf(req).user.id))
    .orderBy(desc(downloads.createdAt), desc(products.id));

  res.json({
    data: rows.map((row) => ({
      product: toProduct(row.product),
      purchasedAt: row.purchasedAt.toISOString(),
    })),
  });
});

// GET /library/:productId/download — a temporary download link (UC-09).
// The purchase is checked here, on the server, every time. The link is valid for
// five minutes and the real file location is never sent to the browser.
libraryRouter.get("/:productId/download", async (req, res) => {
  const { user } = authOf(req);
  const productId = parseId(req.params.productId);
  const product = productId ? await purchasedProduct(user.id, productId) : undefined;
  if (!product) throw errors.productNotPurchased();
  if (!product.fileKey) throw errors.fileNotAvailable();

  const { expires, signature } = signDownload(user.id, product.id);
  const baseUrl = env.publicUrl ?? `${req.protocol}://${req.get("host")}`;
  const query = new URLSearchParams({
    user: String(user.id),
    expires: String(expires),
    signature,
  });

  res.json({
    url: `${baseUrl}/api/v1/downloads/${product.id}?${query}`,
    expiresAt: new Date(expires * 1000).toISOString(),
  });
});

// GET /downloads/:productId?user=&expires=&signature= — the link itself.
// It is opened directly by the browser, so it carries no Authorization header:
// the signature is the proof. The purchase is checked once more before sending.
export const downloadsRouter = Router();

downloadsRouter.get("/:productId", async (req, res) => {
  const productId = parseId(req.params.productId);
  const userId = parseId(req.query.user);
  const expires = Number(req.query.expires);
  const signature = typeof req.query.signature === "string" ? req.query.signature : "";
  if (!productId || !userId || !verifyDownload(userId, productId, expires, signature)) {
    throw errors.downloadLinkInvalid();
  }

  const product = await purchasedProduct(userId, productId);
  if (!product) throw errors.productNotPurchased();

  const filePath = product.fileKey ? path.join(env.storageDir, product.fileKey) : null;
  if (!filePath || !fs.existsSync(filePath)) throw errors.fileNotAvailable();

  res.download(filePath, product.fileName ?? product.fileKey!);
});
