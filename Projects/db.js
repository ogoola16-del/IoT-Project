const { Pool } = require("pg");
require("dotenv").config({ path: "./password.env" });
require("dotenv").config(); // also load .env if present

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

let pool;

if (connectionString) {
  // Preferred for Vercel / Neon / Supabase / Railway etc.
  pool = new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production" ||
      (connectionString && connectionString.includes("sslmode=require"))
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10,
  });
} else {
  // Local development fallback
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ecg_db",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    max: 10,
  });
}

// Compatibility wrapper so existing callback-style code keeps working.
// MySQL used: db.query(sql, params?, callback)
// PostgreSQL returns { rows, rowCount, ... }
const db = {
  query(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    // Convert MySQL-style ? placeholders to $1, $2, ... if still present
    let pgSql = sql;
    let pgParams = params || [];
    if (sql.includes("?")) {
      let i = 0;
      pgSql = sql.replace(/\?/g, () => `$${++i}`);
    }

    if (typeof callback === "function") {
      pool.query(pgSql, pgParams, (err, result) => {
        if (err) return callback(err);
        // Mimic mysql result shape where possible
        const rows = result.rows || [];
        // Attach helpful properties for insert/update
        rows.insertId = result.rows?.[0]?.id ?? result.rows?.[0]?.doctor_id ?? null;
        rows.affectedRows = result.rowCount;
        rows.rowCount = result.rowCount;
        callback(null, rows);
      });
    } else {
      // Promise style
      return pool.query(pgSql, pgParams).then((result) => {
        const rows = result.rows || [];
        rows.insertId = result.rows?.[0]?.id ?? null;
        rows.affectedRows = result.rowCount;
        rows.rowCount = result.rowCount;
        return rows;
      });
    }
  },

  // Expose pool for advanced use
  pool,
};

// Test connection on startup
pool
  .query("SELECT NOW()")
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

module.exports = db;
