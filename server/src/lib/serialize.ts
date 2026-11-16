import type { Order, Product, User } from "../db/schema.js";

// Response layer: the only place database rows are turned into API objects.
// Keeps field names camelCase, ids as strings, prices as decimal strings ("9.00"),
// dates as ISO 8601, and guarantees passwordHash and file paths never leave the server.

export function toUser(user: User) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function toProduct(product: Product) {
  return {
    id: String(product.id),
    title: product.title,
    category: product.category,
    price: product.price,
    description: product.description,
    imageUrl: product.imageUrl,
    maxQuantity: product.maxQuantity,
    isActive: product.isActive,
  };
}

// Admin view: also tells whether a downloadable file has been uploaded.
export function toAdminProduct(product: Product) {
  return { ...toProduct(product), hasFile: product.fileKey !== null };
}

export interface OrderItemRow {
  productId: number;
  title: string;
  unitPrice: string;
}

export function toOrder(order: Order, items: OrderItemRow[]) {
  return {
    id: String(order.id),
    status: order.status,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    items: items.map((item) => ({
      productId: String(item.productId),
      title: item.title,
      unitPrice: item.unitPrice,
    })),
  };
}

// Sums decimal price strings without floating point drift.
export function sumPrices(prices: string[]): string {
  const cents = prices.reduce((sum, price) => sum + Math.round(Number(price) * 100), 0);
  return (cents / 100).toFixed(2);
}
