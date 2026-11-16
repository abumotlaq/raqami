import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { products, type Product } from "../db/schema.js";
import { errors } from "../lib/errors.js";
import { paginated, readPage } from "../lib/pagination.js";
import { toProduct } from "../lib/serialize.js";
import { parseId } from "../lib/validate.js";

// Shared by the public list and the admin list:
// search by title, filter by category, paginate, newest first.
export async function listProducts(
  query: Record<string, unknown>,
  options: { includeHidden: boolean },
) {
  const page = readPage(query);
  const filters: SQL[] = [];
  if (!options.includeHidden) filters.push(eq(products.isActive, true));
  if (typeof query.search === "string" && query.search.trim()) {
    // Escape LIKE wildcards so the text is matched literally.
    const text = query.search.trim().replace(/[\\%_]/g, "\\$&");
    filters.push(ilike(products.title, `%${text}%`));
  }
  if (typeof query.category === "string" && query.category.trim()) {
    filters.push(eq(products.category, query.category.trim()));
  }
  const where = and(...filters);

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(desc(products.id))
    .limit(page.perPage)
    .offset(page.offset);
  const [{ total }] = await db.select({ total: count() }).from(products).where(where);

  return { rows, total, page };
}

export async function findProduct(idParam: unknown): Promise<Product> {
  const id = parseId(idParam);
  const [product] = id ? await db.select().from(products).where(eq(products.id, id)).limit(1) : [];
  if (!product) throw errors.productNotFound();
  return product;
}

export const productsRouter = Router();

// GET /products?search=&category=&page=&per_page= — visible products (UC-01, UC-02).
productsRouter.get("/", async (req, res) => {
  const { rows, total, page } = await listProducts(req.query, { includeHidden: false });
  res.json(paginated(rows.map(toProduct), total, page));
});

// GET /products/:id — product details (UC-03). Hidden products answer 404.
productsRouter.get("/:id", async (req, res) => {
  const product = await findProduct(req.params.id);
  if (!product.isActive) throw errors.productNotFound();
  res.json(toProduct(product));
});
