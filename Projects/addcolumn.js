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

async function addColumn() {
  try {
    await pool.query(`
      ALTER TABLE vitals_data
      ADD COLUMN IF NOT EXISTS "bodyTemp" VARCHAR(20)
    `);
    console.log("Column added successfully!");
  } catch (error) {
    console.error("Error adding column:", error);
  } finally {
    await pool.end();
  }
}

addColumn();
