import { and, asc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { cartItems, carts, downloads, products } from "../db/schema.js";
import { errors } from "../lib/errors.js";
import { sumPrices, toProduct } from "../lib/serialize.js";
import { parse, parseId } from "../lib/validate.js";
import { authOf, requireAuth } from "../middleware/auth.js";
import { findProduct } from "./products.js";

// The products in a user's cart that can still be bought (hidden products are skipped).
export async function cartLines(userId: number) {
  return db
    .select({ product: products, quantity: cartItems.quantity })
    .from(cartItems)
    .innerJoin(carts, eq(carts.id, cartItems.cartId))
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(and(eq(carts.userId, userId), eq(products.isActive, true)))
    .orderBy(asc(cartItems.createdAt));
}

async function cartResponse(userId: number) {
  const lines = await cartLines(userId);
  return {
    items: lines.map((line) => ({ product: toProduct(line.product), quantity: line.quantity })),
    total: sumPrices(lines.map((line) => line.product.price)),
  };
}

// Every user has at most one cart; it is created the first time it is needed.
async function cartIdFor(userId: number): Promise<number> {
  await db.insert(carts).values({ userId }).onConflictDoNothing({ target: carts.userId });
  const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  return cart.id;
}

const addItemBody = z.object({
  productId: z.union([z.string(), z.number()], "معرّف المنتج مطلوب."),
});

export const cartRouter = Router();
cartRouter.use(requireAuth);

// GET /cart — cart contents and total (UC-06).
cartRouter.get("/", async (req, res) => {
  res.json(await cartResponse(authOf(req).user.id));
});

// POST /cart/items { productId } — add a product. Answers with the updated cart.
cartRouter.post("/items", async (req, res) => {
  const { user } = authOf(req);
  const body = parse(addItemBody, req.body);

  const product = await findProduct(body.productId);
  if (!product.isActive) throw errors.productNotFound();

  const [owned] = await db
    .select()
    .from(downloads)
    .where(and(eq(downloads.userId, user.id), eq(downloads.productId, product.id)))
    .limit(1);
  if (owned) throw errors.productAlreadyPurchased();

  const added = await db
    .insert(cartItems)
    .values({ cartId: await cartIdFor(user.id), productId: product.id })
    .onConflictDoNothing()
    .returning();
  if (added.length === 0) throw errors.productAlreadyInCart();

  res.status(201).json(await cartResponse(user.id));
});

// DELETE /cart/items/:productId — remove a product. 204 even if it was not in the cart.
cartRouter.delete("/items/:productId", async (req, res) => {
  const productId = parseId(req.params.productId);
  if (productId) {
    const cartId = await cartIdFor(authOf(req).user.id);
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
  }
  res.status(204).end();
});
