import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { db } from "../db/index.js";
import { products } from "../db/schema.js";
import { env } from "../env.js";
import { errors } from "../lib/errors.js";
import { paginated, readPage } from "../lib/pagination.js";
import { toAdminProduct } from "../lib/serialize.js";
import { parse } from "../lib/validate.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { listOrders } from "../services/orders.js";
import { findProduct, listProducts } from "./products.js";

const productBody = z.object({
  title: z.string("عنوان المنتج مطلوب.").trim().min(1, "عنوان المنتج مطلوب.").max(200, "العنوان طويل جدًا."),
  category: z.string("التصنيف مطلوب.").trim().min(1, "التصنيف مطلوب.").max(100, "التصنيف طويل جدًا."),
  // Accepts "9.00" or 9; stored and returned as a decimal string with two places.
  price: z
    .union([z.string(), z.number()], "السعر مطلوب.")
    .transform((value) => String(value).trim())
    .pipe(z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "السعر يجب أن يكون رقمًا موجبًا بمنزلتين عشريتين على الأكثر."))
    .transform((value) => Number(value).toFixed(2)),
  description: z.string("الوصف مطلوب.").trim().min(1, "الوصف مطلوب.").max(5000, "الوصف طويل جدًا."),
  imageUrl: z.url({ protocol: /^https?$/, error: "رابط الصورة غير صالح." }),
  isActive: z.boolean("القيمة يجب أن تكون true أو false.").optional(),
});

// Product files are saved under a random name in the private storage folder.
const upload = multer({
  storage: multer.diskStorage({
    destination: env.storageDir,
    filename: (_req, file, done) => {
      const extension = path.extname(file.originalname).toLowerCase();
      done(null, randomUUID() + (/^\.[a-z0-9]{1,10}$/.test(extension) ? extension : ""));
    },
  }),
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  defParamCharset: "utf8", // keep Arabic file names readable
});

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

// GET /admin/products — every product, hidden ones included (UC-10).
adminRouter.get("/products", async (req, res) => {
  const { rows, total, page } = await listProducts(req.query, { includeHidden: true });
  res.json(paginated(rows.map(toAdminProduct), total, page));
});

// POST /admin/products — add a product.
adminRouter.post("/products", async (req, res) => {
  const body = parse(productBody, req.body);
  const [product] = await db.insert(products).values(body).returning();
  res.status(201).json(toAdminProduct(product));
});

// PATCH /admin/products/:id — edit any fields; hide or show with isActive.
adminRouter.patch("/products/:id", async (req, res) => {
  const existing = await findProduct(req.params.id);
  const changes = parse(productBody.partial(), req.body);
  if (Object.keys(changes).length === 0) return void res.json(toAdminProduct(existing));

  const [product] = await db
    .update(products)
    .set(changes)
    .where(eq(products.id, existing.id))
    .returning();
  res.json(toAdminProduct(product));
});

// POST /admin/products/:id/file — upload (or replace) the downloadable file.
// multipart/form-data with one field named "file".
adminRouter.post(
  "/products/:id/file",
  async (req, _res, next) => {
    await findProduct(req.params.id); // 404 before accepting the upload
    next();
  },
  upload.single("file"),
  async (req, res) => {
    if (!req.file) throw errors.validation({ file: ["الملف مطلوب."] });

    const existing = await findProduct(req.params.id);
    const [product] = await db
      .update(products)
      .set({ fileKey: req.file.filename, fileName: req.file.originalname })
      .where(eq(products.id, existing.id))
      .returning();
    if (existing.fileKey) {
      await fs.rm(path.join(env.storageDir, existing.fileKey), { force: true });
    }

    res.json(toAdminProduct(product));
  },
);

// GET /admin/orders — all orders with their status and buyer (UC-11).
adminRouter.get("/orders", async (req, res) => {
  const page = readPage(req.query);
  const result = await listOrders(page);
  res.json(
    paginated(
      result.orders.map((row) => ({ ...row.order, user: row.user })),
      result.total,
      page,
    ),
  );
});
