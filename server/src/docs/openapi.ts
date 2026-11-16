// OpenAPI description of the API, shown by Swagger UI at /api/docs.
// Keep it in step with the routes in src/routes.

type Json = Record<string, unknown>;

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: Json) => ({ "application/json": { schema } });

const ok = (description: string, schema?: Json) =>
  schema ? { description, content: json(schema) } : { description };
const error = (description: string) => ({ description, content: json(ref("Error")) });

const paginated = (item: Json) => ({
  type: "object",
  properties: { data: { type: "array", items: item }, meta: ref("PaginationMeta") },
});

const idParam = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", example: "1" },
});

const pageParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
  { name: "per_page", in: "query", schema: { type: "integer", default: 12, minimum: 1, maximum: 100 } },
];
const productFilters = [
  { name: "search", in: "query", description: "Matches part of the title.", schema: { type: "string" } },
  { name: "category", in: "query", description: "Exact category name.", schema: { type: "string" } },
  ...pageParams,
];

const secured = [{ bearerAuth: [] }];
const unauthenticated = error("`UNAUTHENTICATED` — missing, invalid, expired or logged-out token.");
const adminOnly = error("`ADMIN_ONLY` — the user is not an admin.");
const validation = error("`VALIDATION_FAILED` — `errors` maps each field to its messages.");

const productInput = {
  type: "object",
  properties: {
    title: { type: "string", example: "Web Development Basics" },
    category: { type: "string", example: "E-Books" },
    price: { type: "string", example: "12.00", description: 'Decimal string or number, e.g. "9.00" or 9.' },
    description: { type: "string" },
    imageUrl: { type: "string", format: "uri" },
    isActive: { type: "boolean", default: true },
  },
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Raqami API",
    version: "1.0.0",
    description:
      "API of Raqami, an e-commerce system for digital products. " +
      "Ids are strings, prices are decimal strings such as `9.00`, and dates are ISO 8601. " +
      "Every error has the shape `{ code, message, errors }`.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Auth" },
    { name: "Products" },
    { name: "Cart" },
    { name: "Orders" },
    { name: "Library" },
    { name: "Admin" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          code: { type: "string", example: "VALIDATION_FAILED" },
          message: { type: "string" },
          errors: {
            type: "object",
            nullable: true,
            additionalProperties: { type: "array", items: { type: "string" } },
          },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          currentPage: { type: "integer", example: 1 },
          lastPage: { type: "integer", example: 2 },
          perPage: { type: "integer", example: 12 },
          total: { type: "integer", example: 15 },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["customer", "admin"] },
        },
      },
      AuthResponse: {
        type: "object",
        properties: { user: ref("User"), token: { type: "string" } },
      },
      Product: {
        type: "object",
        description: "Never contains the download link.",
        properties: {
          id: { type: "string", example: "1" },
          title: { type: "string" },
          category: { type: "string" },
          price: { type: "string", example: "9.00" },
          description: { type: "string" },
          imageUrl: { type: "string", format: "uri" },
          maxQuantity: { type: "integer", example: 1, description: "Always 1 for digital products." },
          isActive: { type: "boolean" },
        },
      },
      AdminProduct: {
        allOf: [
          ref("Product"),
          {
            type: "object",
            properties: { hasFile: { type: "boolean", description: "The product file has been uploaded." } },
          },
        ],
      },
      Cart: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: { product: ref("Product"), quantity: { type: "integer", example: 1 } },
            },
          },
          total: { type: "string", example: "21.50" },
        },
      },
      OrderItem: {
        type: "object",
        properties: {
          productId: { type: "string", example: "1" },
          title: { type: "string" },
          unitPrice: { type: "string", example: "9.00", description: "Price at the time of purchase." },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          status: { type: "string", enum: ["pending", "paid", "failed"] },
          total: { type: "string", example: "21.50" },
          createdAt: { type: "string", format: "date-time" },
          items: { type: "array", items: ref("OrderItem") },
        },
      },
      AdminOrder: {
        allOf: [
          ref("Order"),
          {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        ],
      },
      LibraryItem: {
        type: "object",
        properties: { product: ref("Product"), purchasedAt: { type: "string", format: "date-time" } },
      },
      DownloadLink: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri" },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Create an account (UC-04)",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["name", "email", "password"],
            properties: {
              name: { type: "string", example: "Ahmed Ali" },
              email: { type: "string", format: "email", example: "ahmed@example.com" },
              password: { type: "string", minLength: 8, example: "password123" },
            },
          }),
        },
        responses: {
          201: ok("Account created.", ref("AuthResponse")),
          409: error("`EMAIL_TAKEN`"),
          422: validation,
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Sign in (UC-05)",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email", example: "ahmed@example.com" },
              password: { type: "string", example: "password123" },
            },
          }),
        },
        responses: {
          200: ok("Signed in.", ref("AuthResponse")),
          401: error("`INVALID_CREDENTIALS`"),
          422: validation,
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Invalidate the token",
        description: "Invalidates every token issued to this user before the logout.",
        security: secured,
        responses: { 204: ok("Logged out."), 401: unauthenticated },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "The signed-in user",
        security: secured,
        responses: { 200: ok("Current user.", ref("User")), 401: unauthenticated },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List visible products with search, category filter and pagination (UC-01, UC-02)",
        parameters: productFilters,
        responses: { 200: ok("A page of products.", paginated(ref("Product"))) },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Product details (UC-03)",
        parameters: [idParam("id", "Product id.")],
        responses: {
          200: ok("The product.", ref("Product")),
          404: error("`PRODUCT_NOT_FOUND` — missing or hidden."),
        },
      },
    },
    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Cart contents and total (UC-06)",
        security: secured,
        responses: { 200: ok("The cart.", ref("Cart")), 401: unauthenticated },
      },
    },
    "/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Add a product to the cart",
        security: secured,
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["productId"],
            properties: { productId: { type: "string", example: "1" } },
          }),
        },
        responses: {
          201: ok("Added. Answers the updated cart.", ref("Cart")),
          401: unauthenticated,
          404: error("`PRODUCT_NOT_FOUND`"),
          409: error("`PRODUCT_ALREADY_IN_CART` or `PRODUCT_ALREADY_PURCHASED`"),
          422: validation,
        },
      },
    },
    "/cart/items/{productId}": {
      delete: {
        tags: ["Cart"],
        summary: "Remove a product from the cart",
        security: secured,
        parameters: [idParam("productId", "Product id.")],
        responses: { 204: ok("Removed."), 401: unauthenticated },
      },
    },
    "/orders": {
      post: {
        tags: ["Orders"],
        summary: "Buy everything in the cart (UC-07)",
        description:
          "Creates the order as `pending` with the current prices, sends the payment to the sandbox, " +
          "then marks it `paid` (download rights created, cart emptied) or `failed` (cart untouched).",
        security: secured,
        requestBody: {
          required: false,
          content: json({
            type: "object",
            properties: {
              sandboxOutcome: {
                type: "string",
                enum: ["success", "failed", "pending"],
                default: "success",
                description: "Chooses how the sandbox payment ends. For demos and tests.",
              },
            },
          }),
        },
        responses: {
          201: ok("Order created. Status is `paid`, or `pending` while the payment is unconfirmed.", ref("Order")),
          401: unauthenticated,
          402: error("`PAYMENT_FAILED` — the cart is left as it was."),
          422: error("`CART_EMPTY`"),
        },
      },
      get: {
        tags: ["Orders"],
        summary: "The user's orders, newest first",
        security: secured,
        parameters: pageParams,
        responses: { 200: ok("A page of orders.", paginated(ref("Order"))), 401: unauthenticated },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "One of the user's orders",
        security: secured,
        parameters: [idParam("id", "Order id.")],
        responses: {
          200: ok("The order.", ref("Order")),
          401: unauthenticated,
          404: error("`ORDER_NOT_FOUND` — missing, or it belongs to another user."),
        },
      },
    },
    "/library": {
      get: {
        tags: ["Library"],
        summary: "Purchased products (UC-08)",
        security: secured,
        responses: {
          200: ok("Purchased products.", {
            type: "object",
            properties: { data: { type: "array", items: ref("LibraryItem") } },
          }),
          401: unauthenticated,
        },
      },
    },
    "/library/{productId}/download": {
      get: {
        tags: ["Library"],
        summary: "Temporary download link, after the purchase is verified (UC-09)",
        description: "The link is signed and valid for five minutes.",
        security: secured,
        parameters: [idParam("productId", "Product id.")],
        responses: {
          200: ok("Signed link.", ref("DownloadLink")),
          401: unauthenticated,
          403: error("`PRODUCT_NOT_PURCHASED`"),
          404: error("`FILE_NOT_AVAILABLE` — the product file has not been uploaded yet."),
        },
      },
    },
    "/downloads/{productId}": {
      get: {
        tags: ["Library"],
        summary: "The signed download link itself",
        description:
          "Opened directly by the browser, so it carries no Authorization header. " +
          "The server checks the signature, the expiry time and the purchase, then sends the file.",
        parameters: [
          idParam("productId", "Product id."),
          { name: "user", in: "query", required: true, schema: { type: "string" } },
          { name: "expires", in: "query", required: true, schema: { type: "integer" } },
          { name: "signature", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "The file.", content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } } },
          403: error("`DOWNLOAD_LINK_INVALID` — the link expired or was changed."),
        },
      },
    },
    "/admin/products": {
      get: {
        tags: ["Admin"],
        summary: "All products, hidden ones included (UC-10)",
        security: secured,
        parameters: productFilters,
        responses: {
          200: ok("A page of products.", paginated(ref("AdminProduct"))),
          401: unauthenticated,
          403: adminOnly,
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Add a product",
        security: secured,
        requestBody: {
          required: true,
          content: json({ ...productInput, required: ["title", "category", "price", "description", "imageUrl"] }),
        },
        responses: {
          201: ok("Product created.", ref("AdminProduct")),
          401: unauthenticated,
          403: adminOnly,
          422: validation,
        },
      },
    },
    "/admin/products/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Edit a product, or hide it by changing isActive",
        security: secured,
        parameters: [idParam("id", "Product id.")],
        requestBody: { required: true, content: json(productInput) },
        responses: {
          200: ok("Product updated.", ref("AdminProduct")),
          401: unauthenticated,
          403: adminOnly,
          404: error("`PRODUCT_NOT_FOUND`"),
          422: validation,
        },
      },
    },
    "/admin/products/{id}/file": {
      post: {
        tags: ["Admin"],
        summary: "Upload or replace the product's downloadable file",
        security: secured,
        parameters: [idParam("id", "Product id.")],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          200: ok("File stored.", ref("AdminProduct")),
          401: unauthenticated,
          403: adminOnly,
          404: error("`PRODUCT_NOT_FOUND`"),
          422: validation,
        },
      },
    },
    "/admin/orders": {
      get: {
        tags: ["Admin"],
        summary: "All orders with their status and buyer (UC-11)",
        security: secured,
        parameters: pageParams,
        responses: {
          200: ok("A page of orders.", paginated(ref("AdminOrder"))),
          401: unauthenticated,
          403: adminOnly,
        },
      },
    },
  },
};
