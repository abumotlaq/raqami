export type FieldErrors = Record<string, string[]>;

// Every error response has the shape { code, message, errors }.
// `code` is a fixed string the frontend can switch on; `message` is shown to the user.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly errors: FieldErrors | null = null,
  ) {
    super(message);
  }
}

export const errors = {
  // Codes defined by the API contract (Appendix A).
  validation: (fields: FieldErrors) =>
    new ApiError(422, "VALIDATION_FAILED", "البيانات المدخلة غير صالحة.", fields),
  invalidCredentials: () =>
    new ApiError(401, "INVALID_CREDENTIALS", "البريد الإلكتروني أو كلمة المرور غير صحيحة."),
  emailTaken: () =>
    new ApiError(409, "EMAIL_TAKEN", "هذا البريد الإلكتروني مستخدم بالفعل.", {
      email: ["هذا البريد الإلكتروني مستخدم بالفعل."],
    }),
  productNotFound: () => new ApiError(404, "PRODUCT_NOT_FOUND", "المنتج غير موجود."),
  productAlreadyInCart: () =>
    new ApiError(409, "PRODUCT_ALREADY_IN_CART", "المنتج موجود في السلة بالفعل."),
  cartEmpty: () => new ApiError(422, "CART_EMPTY", "السلة فارغة."),
  paymentFailed: () =>
    new ApiError(402, "PAYMENT_FAILED", "فشلت عملية الدفع. لم يتغير محتوى السلة، يمكنك المحاولة مجددًا."),
  productNotPurchased: () =>
    new ApiError(403, "PRODUCT_NOT_PURCHASED", "لا يمكنك تحميل هذا المنتج لأنك لم تشترِه."),
  adminOnly: () => new ApiError(403, "ADMIN_ONLY", "هذه الصفحة متاحة للمشرف فقط."),

  // Codes added for cases the contract gives a status for but no code.
  unauthenticated: () =>
    new ApiError(401, "UNAUTHENTICATED", "يجب تسجيل الدخول للمتابعة."),
  productAlreadyPurchased: () =>
    new ApiError(409, "PRODUCT_ALREADY_PURCHASED", "لقد اشتريت هذا المنتج من قبل، وهو متاح في مكتبتك."),
  orderNotFound: () => new ApiError(404, "ORDER_NOT_FOUND", "الطلب غير موجود."),
  fileNotAvailable: () =>
    new ApiError(404, "FILE_NOT_AVAILABLE", "ملف هذا المنتج غير متوفر حاليًا."),
  downloadLinkInvalid: () =>
    new ApiError(403, "DOWNLOAD_LINK_INVALID", "رابط التحميل غير صالح أو انتهت صلاحيته."),
  notFound: () => new ApiError(404, "NOT_FOUND", "المسار المطلوب غير موجود."),
  badRequest: () => new ApiError(400, "INVALID_REQUEST", "الطلب غير صالح."),
  internal: () => new ApiError(500, "INTERNAL_ERROR", "حدث خطأ غير متوقع في الخادم."),
};
