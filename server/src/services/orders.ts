import { and, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { cartItems, carts, downloads, orderItems, orders, products, users } from "../db/schema.js";
import { errors } from "../lib/errors.js";
import type { Page } from "../lib/pagination.js";
import { sumPrices, toOrder, type OrderItemRow } from "../lib/serialize.js";
import * as sandbox from "../payment/sandbox.js";
import { cartLines } from "../routes/cart.js";

// ---- Purchase flow (POST /orders, UC-07) ----

export async function checkout(userId: number, outcome?: sandbox.PaymentOutcome) {
  // 1. The cart must not be empty.
  const lines = await cartLines(userId);
  if (lines.length === 0) throw errors.cartEmpty();

  // 2. Create the order as "pending", saving the current database prices.
  //    Prices never come from the browser, so they cannot be tampered with.
  const total = sumPrices(lines.map((line) => line.product.price));
  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({ userId, total }).returning();
    await tx.insert(orderItems).values(
      lines.map((line) => ({
        orderId: order.id,
        productId: line.product.id,
        unitPrice: line.product.price,
      })),
    );
    return order.id;
  });

  // 3. Send the payment to the sandbox gateway.
  const result = await sandbox.charge({ orderId, amount: total, outcome });

  // 4. Success: order becomes "paid", download rights are created, cart is emptied.
  // 5. Failure: order becomes "failed", cart is left as it is, answer 402.
  //    Pending: the order stays "pending" until the sandbox confirms it.
  if (result !== "pending") await settleOrder(orderId, result);
  if (result === "failed") throw errors.paymentFailed();

  return getOrder(orderId);
}

// Moves a pending order to its final status. Runs in one transaction so an order
// is never "paid" without its download rights. Does nothing if already settled.
export async function settleOrder(orderId: number, status: "paid" | "failed") {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning();
    if (!order || status === "failed") return;

    const items = await tx
      .select({ productId: orderItems.productId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    const productIds = items.map((item) => item.productId);

    await tx
      .insert(downloads)
      .values(productIds.map((productId) => ({ userId: order.userId, productId, orderId })))
      .onConflictDoNothing();

    const userCart = tx.select({ id: carts.id }).from(carts).where(eq(carts.userId, order.userId));
    await tx
      .delete(cartItems)
      .where(and(inArray(cartItems.cartId, userCart), inArray(cartItems.productId, productIds)));
  });
}

// The sandbox reports confirmations of pending payments here.
sandbox.setConfirmationHandler(settleOrder);

// Pending confirmations live in memory; after a restart, schedule them again.
export async function resumePendingOrders() {
  const pending = await db.select({ id: orders.id }).from(orders).where(eq(orders.status, "pending"));
  for (const order of pending) sandbox.confirmLater(order.id);
}

// ---- Reading orders ----

async function itemsByOrder(orderIds: number[]): Promise<Map<number, OrderItemRow[]>> {
  const grouped = new Map<number, OrderItemRow[]>();
  if (orderIds.length === 0) return grouped;

  const rows = await db
    .select({
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      title: products.title,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(orderItems.productId);

  for (const row of rows) {
    const list = grouped.get(row.orderId) ?? [];
    list.push(row);
    grouped.set(row.orderId, list);
  }
  return grouped;
}

// One order with its items. With userId, only that user's own order is found.
export async function getOrder(orderId: number, userId?: number) {
  const filters = [eq(orders.id, orderId)];
  if (userId !== undefined) filters.push(eq(orders.userId, userId));

  const [order] = await db.select().from(orders).where(and(...filters)).limit(1);
  if (!order) throw errors.orderNotFound();

  const items = await itemsByOrder([order.id]);
  return toOrder(order, items.get(order.id) ?? []);
}

// A page of orders, newest first. Each order includes its items and its buyer.
export async function listOrders(page: Page, where?: SQL) {
  const rows = await db
    .select({ order: orders, user: { id: users.id, name: users.name, email: users.email } })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(where)
    .orderBy(desc(orders.id))
    .limit(page.perPage)
    .offset(page.offset);
  const [{ total }] = await db.select({ total: count() }).from(orders).where(where);

  const items = await itemsByOrder(rows.map((row) => row.order.id));
  return {
    total,
    orders: rows.map((row) => ({
      order: toOrder(row.order, items.get(row.order.id) ?? []),
      user: { ...row.user, id: String(row.user.id) },
    })),
  };
}
