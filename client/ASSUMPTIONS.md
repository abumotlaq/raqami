# Assumptions

- `VITE_API_URL`, when configured, includes the `/api/v1` base path. When unset, requests use the relative `/api/v1` path.
- An error response with a valid message but a code outside Appendix A is represented as `INTERNAL_ERROR`; its server-provided message and valid `errors` object are preserved. The report's error-code list is treated as exhaustive.
- A non-JSON or otherwise unreadable error response cannot provide the server's `message` or field errors. The API client uses the generic message `The server returned an unreadable error response.`, code `INTERNAL_ERROR`, and `errors: null`.
- The auth token is the only application value stored in localStorage, under the existing `raqami_token` key.
- Product category filtering uses a free-text value because the contract exposes an exact category filter but does not define a categories endpoint or a canonical category list.
- Product and order lists start with the report's `per_page=12`; page size can be changed within the backend's accepted 1–100 range.
- Successful registration returns the same `{ user, token }` response as login, so registration stores the returned token and establishes the new session.
- A `401 UNAUTHENTICATED` response clears the current session and redirects to login while preserving the protected route as the return destination. Other 401 codes, such as `INVALID_CREDENTIALS`, do not clear a session.
- File upload uses browser-managed `FormData` content-type boundaries; the client does not set the multipart `Content-Type` header manually.
- UI styling uses only the existing neutral tokens in `src/index.css`; this is functional placeholder styling, not a finalized design.
- No mock, seed, or sample data is used under `client/src`. The backend's separate development seeder is outside this client-only implementation.
