# Raqami — Server

Express + TypeScript API for the Raqami digital products store, with PostgreSQL through Drizzle ORM.
It implements the API contract in Appendix A of the project report.

## Run it

```bash
cp .env.example .env        # then set JWT_SECRET to a long random value
docker compose up -d        # PostgreSQL (and pgAdmin on :5050)
pnpm install
pnpm db:migrate             # create the tables
pnpm db:seed                # admin account + 15 sample products
pnpm dev                    # http://localhost:3000
```

The seed creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
Accounts created through `/auth/register` are always customers.

For the frontend, set `VITE_API_URL=http://localhost:3000/api/v1` in `client/.env`.

## API documentation (Swagger)

With the server running, open <http://localhost:3000/api/docs> to read and try every endpoint.
Use **Authorize** with a token from `/auth/login` to call the protected ones.
The raw OpenAPI document is at `/api/docs.json`, and its source is `src/docs/openapi.ts`.

## Layout

| Path | What it holds |
| --- | --- |
| `src/app.ts` | Express app: CORS, JSON, routes, error handler |
| `src/routes/` | One file per resource: `auth`, `products`, `cart`, `orders`, `library`, `admin` |
| `src/services/orders.ts` | Purchase flow and order queries |
| `src/payment/sandbox.ts` | Fake payment gateway (success, failure, pending) |
| `src/middleware/` | `requireAuth`, `requireAdmin`, error handler |
| `src/lib/` | Error codes, validation, pagination, response serializers, tokens |
| `src/docs/openapi.ts` | OpenAPI description shown by Swagger UI |
| `src/db/schema.ts` | Tables: users, products, carts, cart_items, orders, order_items, downloads |
| `storage/` | Private product files. Not served statically, not in git |

## API details the contract leaves open

Base path `/api/v1`. Ids are strings. Prices are decimal strings (`"9.00"`). Dates are ISO 8601.
Lists answer `{ data, meta }`; single objects are returned as-is, without a wrapper.

### Request bodies

| Endpoint | Body |
| --- | --- |
| `POST /auth/register` | `{ name, email, password }` — password is 8 characters or more |
| `POST /auth/login` | `{ email, password }` |
| `POST /auth/logout` | none — invalidates every token of this user issued before the logout |
| `POST /cart/items` | `{ productId }` |
| `POST /orders` | none (optional `{ sandboxOutcome }`, see below) |
| `POST /admin/products` | `{ title, category, price, description, imageUrl, isActive? }` |
| `PATCH /admin/products/{id}` | any subset of the fields above |

### Response bodies

| Endpoint | Response |
| --- | --- |
| `GET /cart`, `POST /cart/items` | `{ items: [{ product: Product, quantity: 1 }], total: "21.50" }` |
| `POST /orders`, `GET /orders/{id}` | `Order` with `items` |
| `GET /orders` | `{ data: Order[], meta }` — each order includes `items` |
| `GET /library` | `{ data: [{ product: Product, purchasedAt }] }` — not paginated |
| `GET /library/{productId}/download` | `{ url, expiresAt }` |
| `GET /admin/products` | `{ data: AdminProduct[], meta }` — accepts `search`, `category`, `page`, `per_page` |
| `POST`/`PATCH /admin/products` | `AdminProduct` = `Product` + `hasFile: boolean` |
| `GET /admin/orders` | `{ data, meta }` — each order includes `items` and `user: { id, name, email }` |

### Errors

Always `{ code, message, errors }`. `message` is in Arabic and ready to show to the user.
`errors` is `null`, except for `VALIDATION_FAILED` and `EMAIL_TAKEN`, where it maps each field to its messages:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "البيانات المدخلة غير صالحة.",
  "errors": { "email": ["صيغة البريد الإلكتروني غير صحيحة."] }
}
```

Codes added on top of the contract's list:

| Status | Code | When |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Missing, invalid, expired or logged-out token |
| 409 | `PRODUCT_ALREADY_PURCHASED` | Adding a product the user already owns to the cart |
| 404 | `ORDER_NOT_FOUND` | Order missing or belongs to another user |
| 404 | `FILE_NOT_AVAILABLE` | Product was bought but the admin has not uploaded its file |
| 403 | `DOWNLOAD_LINK_INVALID` | Download link expired or was changed |
| 404 | `NOT_FOUND` | Unknown route |
| 400 | `INVALID_REQUEST` | Malformed JSON body |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### Additions to the contract

- `POST /admin/products/{id}/file` — uploads or replaces the product's downloadable file.
  Send `multipart/form-data` with one field named `file`. Answers the `AdminProduct`.
- `GET /downloads/{productId}?user=&expires=&signature=` — the signed link returned by
  `/library/{productId}/download`. The frontend never builds it; it only opens the `url` it was given.

## Payment sandbox

`POST /orders` sends the payment to `src/payment/sandbox.ts`, which succeeds by default.
To show the other cases, send `sandboxOutcome` in the body:

| `sandboxOutcome` | Result |
| --- | --- |
| `success` (default) | `201`, order `paid`, cart emptied, products added to the library |
| `failed` | `402 PAYMENT_FAILED`, order saved as `failed`, cart unchanged |
| `pending` | `201`, order `pending`; it becomes `paid` after `PAYMENT_PENDING_SECONDS` (9 by default) |

`PAYMENT_DEFAULT_OUTCOME` in `.env` changes the default without touching the frontend.

## Download security

1. `GET /library/{productId}/download` checks the `downloads` table for this user and product. No row means `403 PRODUCT_NOT_PURCHASED`. A row is created only when an order is paid, and points to that order.
2. It answers a link signed with HMAC-SHA256 over the user, product and expiry time, valid for five minutes.
3. Opening the link checks the signature, the expiry and the purchase again, then streams the file.

The file's location on disk is never sent to the browser, and `storage/` is not exposed by any static route.
