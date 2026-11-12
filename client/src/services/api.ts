import type {
  ApiError,
  ApiErrorCode,
  AuthResponse,
  DownloadLink,
  Order,
  Paginated,
  Product,
  User,
} from '../types/api'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(
  /\/+$/,
  '',
)

const apiErrorCodes = new Set<string>([
  'VALIDATION_FAILED',
  'INVALID_CREDENTIALS',
  'EMAIL_TAKEN',
  'PRODUCT_NOT_FOUND',
  'PRODUCT_ALREADY_IN_CART',
  'CART_EMPTY',
  'PAYMENT_FAILED',
  'PRODUCT_NOT_PURCHASED',
  'ADMIN_ONLY',
])

declare const pendingContractBrand: unique symbol

export type PendingContract<Endpoint extends string> = {
  readonly [pendingContractBrand]: Endpoint
}

export interface ProductsQuery {
  search?: string
  category?: string
  page?: number
  per_page?: number
}

// PENDING_CONTRACT: Appendix A does not define the register request body.
export type RegisterRequestBody = PendingContract<'POST /auth/register body'>

// PENDING_CONTRACT: Appendix A does not define the admin product request bodies.
export type AdminProductRequestBody = PendingContract<
  'POST /admin/products or PATCH /admin/products/{id} body'
>

// PENDING_CONTRACT: Appendix A does not define the cart response item shape.
export type PendingCartResponse = unknown

// PENDING_CONTRACT: Appendix A does not define the library response item shape.
export type PendingLibraryResponse = unknown

export class ApiResponseError extends Error implements ApiError {
  readonly code: ApiErrorCode

  constructor(
    code: ApiErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiResponseError'
    this.code = code
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH'
  token?: string | null
  body?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && apiErrorCodes.has(value)
}

function parseErrorPayload(text: string): ApiError {
  if (text) {
    try {
      const payload: unknown = JSON.parse(text)
      if (isRecord(payload) && typeof payload.message === 'string') {
        const code = isApiErrorCode(payload.code)
          ? payload.code
          : 'VALIDATION_FAILED'

        return { code, message: payload.message }
      }
    } catch {
      // The response body is not JSON; return the documented generic fallback.
    }
  }

  return {
    code: 'VALIDATION_FAILED',
    message: 'The server returned an unreadable error response.',
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body,
  })
  const responseText = await response.text()

  if (!response.ok) {
    const apiError = parseErrorPayload(responseText)
    throw new ApiResponseError(apiError.code, apiError.message, response.status)
  }

  if (!responseText.trim()) {
    return undefined as T
  }

  try {
    return JSON.parse(responseText) as T
  } catch {
    throw new Error('The server returned an invalid JSON response.')
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

export function register(
  body: RegisterRequestBody,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// PENDING_CONTRACT: Appendix A does not specify the login request body.
export function login(): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', { method: 'POST' })
}

export function logout(token?: string | null): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST', token })
}

export function getCurrentUser(token?: string | null): Promise<User> {
  return request<User>('/auth/me', { token })
}

export function getProducts(
  params: ProductsQuery = {},
): Promise<Paginated<Product>> {
  const query = new URLSearchParams()
  if (params.search !== undefined) query.set('search', params.search)
  if (params.category !== undefined) query.set('category', params.category)
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.per_page !== undefined) {
    query.set('per_page', String(params.per_page))
  }

  const search = query.size > 0 ? `?${query.toString()}` : ''
  return request<Paginated<Product>>(`/products${search}`)
}

export function getProduct(id: string): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(id)}`)
}

export function getCart(token?: string | null): Promise<PendingCartResponse> {
  return request<PendingCartResponse>('/cart', { token })
}

// PENDING_CONTRACT: Appendix A does not define the cart item response body.
export function addCartItem(
  productId: string,
  token?: string | null,
): Promise<unknown> {
  return request<unknown>('/cart/items', {
    method: 'POST',
    token,
    body: JSON.stringify({ productId }),
  })
}

export function removeCartItem(
  productId: string,
  token?: string | null,
): Promise<void> {
  return request<void>(`/cart/items/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    token,
  })
}

// PENDING_CONTRACT: Appendix A does not define the create order response body.
export function createOrder(token?: string | null): Promise<unknown> {
  return request<unknown>('/orders', { method: 'POST', token })
}

// PENDING_CONTRACT: Appendix A does not state whether order list items include items.
export function getOrders(
  token?: string | null,
): Promise<Paginated<unknown>> {
  return request<Paginated<unknown>>('/orders', { token })
}

export function getOrder(
  id: string,
  token?: string | null,
): Promise<Order> {
  return request<Order>(`/orders/${encodeURIComponent(id)}`, { token })
}

export function getLibrary(
  token?: string | null,
): Promise<PendingLibraryResponse> {
  return request<PendingLibraryResponse>('/library', { token })
}

export function getDownloadLink(
  productId: string,
  token?: string | null,
): Promise<DownloadLink> {
  return request<DownloadLink>(
    `/library/${encodeURIComponent(productId)}/download`,
    { token },
  )
}

// PENDING_CONTRACT: Appendix A does not define the admin product list response shape.
export function getAdminProducts(token?: string | null): Promise<unknown> {
  return request<unknown>('/admin/products', { token })
}

// PENDING_CONTRACT: Appendix A does not define the create response body.
export function createAdminProduct(
  body: AdminProductRequestBody,
  token?: string | null,
): Promise<unknown> {
  return request<unknown>('/admin/products', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
}

// PENDING_CONTRACT: Appendix A does not define the update response body.
export function updateAdminProduct(
  id: string,
  body: AdminProductRequestBody,
  token?: string | null,
): Promise<unknown> {
  return request<unknown>(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(body),
  })
}

// PENDING_CONTRACT: Appendix A does not specify pagination or order item fields here.
export function getAdminOrders(token?: string | null): Promise<unknown> {
  return request<unknown>('/admin/orders', { token })
}
