/**
 * One-off migration helper for PostgreSQL.
 * Prefer running database/schema.sql instead.
 */
const { Pool } = require("pg");
require("dotenv").config({ path: "./password.env" });
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ecg_db",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE doctors
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE
    `);
    console.log("✅ is_verified column added/verified");

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ email_verifications table created/verified");
    console.log("✅ Migration completed!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
