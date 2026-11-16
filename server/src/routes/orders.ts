import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { orders } from "../db/schema.js";
import { errors } from "../lib/errors.js";
import { paginated, readPage } from "../lib/pagination.js";
import { parse, parseId } from "../lib/validate.js";
import { authOf, requireAuth } from "../middleware/auth.js";
import { paymentOutcomes } from "../payment/sandbox.js";
import { checkout, getOrder, listOrders } from "../services/orders.js";

// Optional: lets a demo or test choose how the sandbox payment ends.
const checkoutBody = z.object({
  sandboxOutcome: z
    .enum(paymentOutcomes, "القيم المسموحة: success أو failed أو pending.")
    .optional(),
});

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

// POST /orders — buy everything in the cart (UC-07).
// 201 with the order (status "paid", or "pending" while the payment is unconfirmed),
// 402 PAYMENT_FAILED, 422 CART_EMPTY.
ordersRouter.post("/", async (req, res) => {
  const body = parse(checkoutBody, req.body);
  const order = await checkout(authOf(req).user.id, body.sandboxOutcome);
  res.status(201).json(order);
});

// GET /orders — the signed-in user's orders, paginated.
ordersRouter.get("/", async (req, res) => {
  const page = readPage(req.query);
  const result = await listOrders(page, eq(orders.userId, authOf(req).user.id));
  res.json(paginated(result.orders.map((row) => row.order), result.total, page));
});

// GET /orders/:id — one order. Someone else's order answers 404, same as a missing one.
ordersRouter.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) throw errors.orderNotFound();
  res.json(await getOrder(id, authOf(req).user.id));
});
