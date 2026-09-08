const db = require("../db");

function createOrganizationTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS organizations (
      organization_id VARCHAR(20) PRIMARY KEY,
      organization_name VARCHAR(150) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      phone VARCHAR(50),
      address TEXT,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error("Error creating organizations table:", err);
      return;
    }
    console.log("organizations table ready.");
  });
}

module.exports = createOrganizationTable;
