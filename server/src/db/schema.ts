import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => numeric(name, { precision: 10, scale: 2 });

export const userRole = pgEnum("user_role", ["customer", "admin"]);
export const orderStatus = pgEnum("order_status", ["pending", "paid", "failed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("customer"),
  createdAt: createdAt(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  price: money("price").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  // Digital products are bought once, so this is always 1.
  maxQuantity: integer("max_quantity").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  // Name of the stored file inside the private storage folder. Never sent to clients.
  fileKey: text("file_key"),
  // Original file name, used as the download name.
  fileName: text("file_name"),
  createdAt: createdAt(),
});

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: integer("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.cartId, t.productId] })],
);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  total: money("total").notNull(),
  status: orderStatus("status").notNull().default("pending"),
  createdAt: createdAt(),
});

export const orderItems = pgTable(
  "order_items",
  {
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    // Price at the time of purchase; later price changes do not affect the order.
    unitPrice: money("unit_price").notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.productId] })],
);

// One row = this user has the right to download this product.
export const downloads = pgTable(
  "downloads",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

// Tokens invalidated by logout, kept until they would have expired anyway.
export const revokedTokens = pgTable("revoked_tokens", {
  jti: text("jti").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
