const express = require("express");
const router = express.Router();
const db = require("../db");

// =========================
// ORGANIZATION SIGNUP
// =========================

router.post("/signup", (req, res) => {
  const { organization_name, email, phone, address, password } = req.body;

  console.log("Signup request received:", {
    organization_name,
    email,
    phone,
    address,
  });

  if (!organization_name || !email || !phone || !address || !password) {
    return res.status(400).json({
      error: "All fields are required.",
    });
  }

  const getTotalOrganizations = `
    SELECT COUNT(*)::int AS total
    FROM organizations
  `;

  db.query(getTotalOrganizations, (err, results) => {
    if (err) {
      console.error("Error counting organizations:", err);
      return res.status(500).json({
        error: "Database error.",
        detail: err.message, // helps debug on Vercel
      });
    }

    const totalOrganizations = Number(results[0]?.total ?? 0);

    const organizationId =
      "ORGE" + String(totalOrganizations + 1).padStart(4, "0");

    console.log("Total organizations:", totalOrganizations);
    console.log("New organization ID:", organizationId);

    const sql = `
      INSERT INTO organizations
      (
        organization_id,
        organization_name,
        email,
        phone,
        address,
        password
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    db.query(
      sql,
      [organizationId, organization_name, email, phone, address, password],
      (err) => {
        if (err) {
          console.error("Organization signup error:", err);

          // Postgres unique violation
          if (err.code === "23505") {
            return res.status(400).json({
              error: "An organization with this email already exists.",
            });
          }

          // Table does not exist
          if (err.code === "42P01") {
            return res.status(500).json({
              error: "Database tables not found. Run database/schema.sql in Supabase SQL Editor.",
              detail: err.message,
            });
          }

          return res.status(500).json({
            error: "Database error.",
            detail: err.message,
          });
        }

        res.json({
          success: true,
          message: "Organization created successfully.",
          organizationId,
          organizationName: organization_name,
        });
      }
    );
  });
});

module.exports = router;
