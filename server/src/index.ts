import express from "express";
import { sql } from "drizzle-orm";
import { db, pool } from "./db/index.js";
import { env } from "./env.js";

const app = express();
app.use(express.json());

app.get("/health", async (_req, res) => {
  await db.execute(sql`select 1`);
  res.json({ status: "ok" });
});

const server = app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});

const shutdown = () => {
  server.close(() => pool.end().then(() => process.exit(0)));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
