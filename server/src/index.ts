import fs from "node:fs";
import { app } from "./app.js";
import { pool } from "./db/index.js";
import { env } from "./env.js";
import { resumePendingOrders } from "./services/orders.js";

fs.mkdirSync(env.storageDir, { recursive: true });

const server = app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
  resumePendingOrders().catch((err) => console.error("Could not resume pending orders", err));
});

const shutdown = () => {
  server.close(() => pool.end().then(() => process.exit(0)));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
