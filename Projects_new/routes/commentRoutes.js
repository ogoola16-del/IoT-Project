const express = require("express");
const router = express.Router();
const db = require("../db");


// =========================
// SAVE DOCTOR COMMENT
// =========================

router.post("/comments", (req, res) => {

    const {
        doctorId,
        patientId,
        comment
    } = req.body;


    // Check required information
    if (!doctorId || !patientId || !comment) {
        return res.status(400).json({
            error: "Doctor ID, Patient ID and comment are required."
        });
    }


    const sql = `
        INSERT INTO doctor_comments
        (doctor_id, patient_id, comment)
        VALUES (?, ?, ?)
        RETURNING id
    `;


    db.query(
        sql,
        [doctorId, patientId, comment],
        (err, result) => {

            if (err) {

                console.error("Comment save error:", err);

                return res.status(500).json({
                    error: "Database error."
                });
            }


            res.status(201).json({
                message: "Comment saved successfully.",
                commentId: result.insertId
            });

        }
    );

});


    // GET PREVIOUS COMMENTS FOR A PATIENT
    router.get("/comments/:patientId", (req, res) => {

    const { patientId } = req.params;

    const sql = `
    SELECT
        doctor_comments.comment,
        doctor_comments.created_at,
        doctors.name AS doctor_name
    FROM doctor_comments
    JOIN doctors
        ON doctor_comments.doctor_id = doctors.doctor_id
    WHERE doctor_comments.patient_id = ?
    ORDER BY doctor_comments.created_at DESC
`;

    db.query(
        sql,
        [patientId],
        (err, results) => {

            if (err) {
                console.error("Comment retrieval error:", err);

                return res.status(500).json({
                    error: "Database error."
                });
            }

            res.json(results);
        }
    );
});



module.exports = router;