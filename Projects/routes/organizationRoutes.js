const express = require("express");

const router = express.Router();

const db = require("../db");


// =========================
// ORGANIZATION SIGNUP
// =========================

router.post("/signup", (req, res) => {

    const {
        organization_name,
        email,
        phone,
        address,
        password
    } = req.body;

    console.log("Signup request received:", {
        organization_name,
        email,
        phone,
        address 
    });


    // =========================
    // CHECK REQUIRED FIELDS
    // =========================

    if (
        !organization_name ||
        !email ||
        !phone ||
        !address ||
        !password
    ) {

        return res.status(400).json({
            error: "All fields are required."
        });

    }


// =========================
// GENERATE ORGANIZATION ID
// =========================

const getTotalOrganizations = `
    SELECT COUNT(*) AS total
    FROM organizations
`;

db.query(getTotalOrganizations, (err, results) => {

    if (err) {

        console.error(
            "Error counting organizations:",
            err
        );

        return res.status(500).json({
            error: "Database error."
        });
    }

    const totalOrganizations = results[0].total;

    let organizationId =
        "ORGE" +
        String(totalOrganizations + 1)
            .padStart(4, "0");

    console.log(
        "Total organizations:",
        totalOrganizations
    );

    console.log(
        "New organization ID:",
        organizationId
    );

        // =========================
        // INSERT ORGANIZATION
        // =========================

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

            VALUES (?, ?, ?, ?, ?, ?)
        `;


        db.query(
            sql,

            [
                organizationId,
                organization_name,
                email,
                phone,
                address,
                password
            ],

            (err) => {

                if (err) {

                    console.error(
                        "Organization signup error:",
                        err
                    );


                    // =========================
                    // DUPLICATE EMAIL
                    // =========================

                    if (
                        err.code === "23505"
                    ) {

                        return res.status(400).json({

                            error:
                                "An organization with this email already exists."

                        });

                    }


                    return res.status(500).json({

                        error:
                            "Database error."

                    });

                }


                // =========================
                // SUCCESS (modified to include organizationName)
                // =========================

                res.json({

                    success: true,

                    message:
                        "Organization created successfully.",

                    organizationId:
                        organizationId,
                    
                    organizationName:
                        organization_name  // ADDED: Return the organization name

                });

            }
        );

    });

});


module.exports = router;