# Assumptions

- The frontend team structure described in the project prompt is the agreed structure: shared API types in `src/types/`, API calls only in `src/services/api.ts`, contexts in `src/context/`, components grouped under `src/components/`, route pages in `src/pages/`, and routing in `src/routes/`.
- The existing Vite and Tailwind CSS v4 setup remains the frontend build baseline.
- Initial design tokens are provisional defaults only, pending the UI/UX designer's final design.
- The Arabic font stack uses system fonts (`Tahoma`, `Arial`, and sans-serif) and does not rely on downloading a font.
- No `any` types have been introduced.
- `VITE_API_URL`, when set, is expected to include the `/api/v1` base path. If it is unset, the API client uses the relative `/api/v1` path.
- The auth token is stored under the `raqami_token` localStorage key; no other application data is stored there.
- For a non-JSON error response, the API client uses the generic message `The server returned an unreadable error response.` The contract defines no generic error code, so the existing `VALIDATION_FAILED` code is used as a fallback and must not be interpreted as the actual cause.
- Unspecified API response shapes remain `unknown` and are not rendered as cart or library items until the contract is confirmed.
- Appendix A does not specify the login request body. The temporary login request sends no body so it does not invent credential field names.
- ESLint with `typescript-eslint` is temporarily disabled for linting because `typescript-eslint@8.72.2` does not support the team's TypeScript `7.0.2`. Step 5 verification relies on `pnpm exec tsc --noEmit` and `pnpm exec vite build`. Re-enable lint when `typescript-eslint` supports TypeScript 7.1 or later; keep `eslint.config.ts` unchanged so it can be re-enabled without rewriting it.
