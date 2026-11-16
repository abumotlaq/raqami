import cors from "cors";
import { sql } from "drizzle-orm";
import express, { Router } from "express";
import { db } from "./db/index.js";
import { env } from "./env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { cartRouter } from "./routes/cart.js";
import { downloadsRouter, libraryRouter } from "./routes/library.js";
import { ordersRouter } from "./routes/orders.js";
import { productsRouter } from "./routes/products.js";

export const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", async (_req, res) => {
  await db.execute(sql`select 1`);
  res.json({ status: "ok" });
});

const api = Router();
api.use("/auth", authRouter);
api.use("/products", productsRouter);
api.use("/cart", cartRouter);
api.use("/orders", ordersRouter);
api.use("/library", libraryRouter);
api.use("/downloads", downloadsRouter);
api.use("/admin", adminRouter);

app.use("/api/v1", api);
app.use(notFound);
app.use(errorHandler);
