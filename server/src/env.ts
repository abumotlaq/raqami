import path from "node:path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const port = Number(process.env.PORT ?? 3000);

export const env = {
  port,
  databaseUrl: required("DATABASE_URL"),
  // Signs auth tokens and download links.
  jwtSecret: required("JWT_SECRET"),
  tokenTtlSeconds: Number(process.env.TOKEN_TTL_HOURS ?? 24 * 7) * 3600,
  // Allowed browser origin for the frontend; "*" allows any.
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Base URL used in download links. Defaults to the host of the incoming request.
  publicUrl: process.env.PUBLIC_URL?.replace(/\/+$/, ""),
  // Private folder holding product files. Not served statically.
  storageDir: path.resolve(process.env.STORAGE_DIR ?? "storage"),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 100) * 1024 * 1024,
  payment: {
    // Outcome used when POST /orders does not ask for a specific one.
    defaultOutcome: process.env.PAYMENT_DEFAULT_OUTCOME ?? "success",
    // How long a "pending" payment waits before the sandbox confirms it.
    pendingMs: Number(process.env.PAYMENT_PENDING_SECONDS ?? 9) * 1000,
  },
};
