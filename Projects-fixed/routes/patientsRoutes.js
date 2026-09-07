const express = require("express");
const router = express.Router();

const db = require("../db");

router.get("/", (req, res) => {

    const sql = `
        SELECT patient_id, name, age
        FROM patient_data
        ORDER BY patient_id ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Database error"
            });

        }

        res.json(results);

    });

});

module.exports = router;