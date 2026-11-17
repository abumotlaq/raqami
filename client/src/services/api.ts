import type {
  AddCartItemRequestBody,
  AdminOrder,
  AdminProduct,
  AdminProductCreateRequestBody,
  AdminProductPatchRequestBody,
  ApiError,
  ApiErrorCode,
  AuthResponse,
  Cart,
  DownloadLink,
  FieldErrors,
  LibraryResponse,
  LoginRequestBody,
  Order,
  Paginated,
  PaginationQuery,
  Product,
  ProductsQuery,
  RegisterRequestBody,
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
  'UNAUTHENTICATED',
  'PRODUCT_ALREADY_PURCHASED',
  'ORDER_NOT_FOUND',
  'FILE_NOT_AVAILABLE',
  'DOWNLOAD_LINK_INVALID',
  'NOT_FOUND',
  'INVALID_REQUEST',
  'INTERNAL_ERROR',
])

let unauthenticatedHandler: (() => void) | null = null

export function setUnauthenticatedHandler(handler: () => void): () => void {
  unauthenticatedHandler = handler
  return () => {
    if (unauthenticatedHandler === handler) {
      unauthenticatedHandler = null
    }
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH'
  token?: string | null
  body?: string | FormData
}

export class ApiResponseError extends Error implements ApiError {
  readonly code: ApiErrorCode
  readonly errors: FieldErrors | null

  constructor(
    apiError: ApiError,
    readonly status: number,
  ) {
    super(apiError.message)
    this.name = 'ApiResponseError'
    this.code = apiError.code
    this.errors = apiError.errors
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function parseFieldErrors(value: unknown): FieldErrors | null {
  if (value === null || !isRecord(value)) return null

  const entries = Object.entries(value)
  if (!entries.every(([, messages]) => isStringArray(messages))) return null
  return Object.fromEntries(entries) as FieldErrors
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && apiErrorCodes.has(value)
}

function parseErrorPayload(text: string): ApiError {
  if (text) {
    try {
      const payload: unknown = JSON.parse(text)
      if (isRecord(payload) && typeof payload.message === 'string') {
        return {
          code: isApiErrorCode(payload.code) ? payload.code : 'INTERNAL_ERROR',
          message: payload.message,
          errors: parseFieldErrors(payload.errors),
        }
      }
    } catch {
      // The response body is not JSON; use a generic internal-error fallback.
    }
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'The server returned an unreadable error response.',
    errors: null,
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
  if (typeof options.body === 'string') {
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
    if (response.status === 401 && apiError.code === 'UNAUTHENTICATED') {
      unauthenticatedHandler?.()
    }
    throw new ApiResponseError(apiError, response.status)
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

function queryString(params: PaginationQuery): string {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.per_page !== undefined) {
    query.set('per_page', String(params.per_page))
  }
  return query.size > 0 ? `?${query.toString()}` : ''
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

export function register(body: RegisterRequestBody): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function login(body: LoginRequestBody): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
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
  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  return request<Paginated<Product>>(`/products${suffix}`)
}

export function getProduct(id: string): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(id)}`)
}

export function getCart(token?: string | null): Promise<Cart> {
  return request<Cart>('/cart', { token })
}

export function addCartItem(
  body: AddCartItemRequestBody,
  token?: string | null,
): Promise<Cart> {
  return request<Cart>('/cart/items', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
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

export function createOrder(token?: string | null): Promise<Order> {
  return request<Order>('/orders', { method: 'POST', token })
}

export function getOrders(
  params: PaginationQuery = {},
  token?: string | null,
): Promise<Paginated<Order>> {
  return request<Paginated<Order>>(`/orders${queryString(params)}`, { token })
}

export function getOrder(
  id: string,
  token?: string | null,
): Promise<Order> {
  return request<Order>(`/orders/${encodeURIComponent(id)}`, { token })
}

export function getLibrary(token?: string | null): Promise<LibraryResponse> {
  return request<LibraryResponse>('/library', { token })
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

export function getAdminProducts(
  params: PaginationQuery = {},
  token?: string | null,
): Promise<Paginated<AdminProduct>> {
  return request<Paginated<AdminProduct>>(
    `/admin/products${queryString(params)}`,
    { token },
  )
}

export function createAdminProduct(
  body: AdminProductCreateRequestBody,
  token?: string | null,
): Promise<AdminProduct> {
  return request<AdminProduct>('/admin/products', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
}

export function updateAdminProduct(
  id: string,
  body: AdminProductPatchRequestBody,
  token?: string | null,
): Promise<AdminProduct> {
  return request<AdminProduct>(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(body),
  })
}

export function uploadAdminProductFile(
  id: string,
  file: File,
  token?: string | null,
): Promise<AdminProduct> {
  const body = new FormData()
  body.append('file', file)
  return request<AdminProduct>(
    `/admin/products/${encodeURIComponent(id)}/file`,
    { method: 'POST', token, body },
  )
}

export function getAdminOrders(
  params: PaginationQuery = {},
  token?: string | null,
): Promise<Paginated<AdminOrder>> {
  return request<Paginated<AdminOrder>>(`/admin/orders${queryString(params)}`, {
    token,
  })
}
