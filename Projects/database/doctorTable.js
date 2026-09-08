const db = require("../db");

function createDoctorTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS doctors (
      doctor_id VARCHAR(20) PRIMARY KEY,
      organization_id VARCHAR(20) NOT NULL
        REFERENCES organizations(organization_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (organization_id, email)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error("Error creating doctors table:", err);
      return;
    }
    console.log("doctors table ready.");
  });
}

module.exports = createDoctorTable;
