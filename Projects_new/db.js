const { Pool } = require("pg");

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
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 8000,
  });
} else {
  // No DATABASE_URL – create a dummy-like pool that will fail queries with a clear message
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ecg_db",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    max: 3,
    connectionTimeoutMillis: 3000,
  });
}

// Prevent unhandled pool errors from crashing the function
pool.on("error", (err) => {
  console.error("Unexpected PG pool error:", err.message);
});

const db = {
  query(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    let pgSql = sql;
    const pgParams = params || [];
    if (sql.includes("?")) {
      let i = 0;
      pgSql = sql.replace(/\?/g, () => `$${++i}`);
    }

    if (typeof callback === "function") {
      pool.query(pgSql, pgParams, (err, result) => {
        if (err) return callback(err);
        const rows = result.rows || [];
        rows.insertId = result.rows?.[0]?.id ?? null;
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

module.exports = db;
