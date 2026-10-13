require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT ?? 4000);

const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "pricescope",
  password: process.env.DB_PASSWORD ?? "pricescope",
  database: process.env.DB_NAME ?? "pricescope",
});

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    return res.status(503).json({ status: "degraded", database: "disconnected" });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
