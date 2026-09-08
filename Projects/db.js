const { Pool } = require("pg");

// Load env (Vercel injects env vars automatically; local uses .env / password.env)
try {
  require("dotenv").config({ path: "./password.env" });
  require("dotenv").config();
} catch (_) {}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.SUPABASE_DB_URL;

let pool;

if (connectionString) {
  // Supabase / Neon / Vercel Postgres – always use SSL in production
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5, // serverless: keep pool small
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
} else {
  // Local development
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ecg_db",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    max: 10,
  });
}

const db = {
  query(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    let pgSql = sql;
    let pgParams = params || [];
    if (sql.includes("?")) {
      let i = 0;
      pgSql = sql.replace(/\?/g, () => `$${++i}`);
    }

    if (typeof callback === "function") {
      pool.query(pgSql, pgParams, (err, result) => {
        if (err) return callback(err);
        const rows = result.rows || [];
        rows.insertId = result.rows?.[0]?.id ?? result.rows?.[0]?.doctor_id ?? null;
        rows.affectedRows = result.rowCount;
        rows.rowCount = result.rowCount;
        callback(null, rows);
      });
    } else {
      return pool.query(pgSql, pgParams).then((result) => {
        const rows = result.rows || [];
        rows.insertId = result.rows?.[0]?.id ?? null;
        rows.affectedRows = result.rowCount;
        rows.rowCount = result.rowCount;
        return rows;
      });
    }
  },
  pool,
};

// Log connection status (shows in Vercel function logs)
pool
  .query("SELECT NOW() as now")
  .then((r) => console.log("Connected to PostgreSQL at", r.rows[0].now))
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    console.error("Make sure DATABASE_URL is set in Vercel Environment Variables");
  });

module.exports = db;
