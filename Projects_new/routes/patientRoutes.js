const express = require("express");
const router = express.Router();

const db = require("../db");
const activePatient = require("../activePatient");


// ============================================================
// CREATE NEW PATIENT
// ============================================================

router.post("/new", (req, res) => {

    const {
        name,
        age,
        gender,
        cardid,
        weight,
        height,
        bp,
        doctorId  // NEW: Required
    } = req.body;


    if (
        !name ||
        !age ||
        !gender ||
        !cardid ||
        !weight ||
        !height ||
        !bp
    ) {
        return res.status(400).json({
            error: "All patient details are required."
        });
    }

    if (!doctorId) {
        return res.status(400).json({
            error: "doctorId is required."
        });
    }


    const getLastId = `
        SELECT patient_id
        FROM patient_data
        ORDER BY patient_id DESC
        LIMIT 1
    `;


    db.query(getLastId, (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Database error"
            });
        }


        let patientId = "P0001";


        if (result.length > 0) {

            const last =
                parseInt(
                    result[0].patient_id.substring(1)
                );

            patientId =
                "P" +
                String(last + 1).padStart(4, "0");
        }


        const insertSql = `
            INSERT INTO patient_data
            (
                patient_id,
                name,
                age,
                Gender,
                Hospital_CardId,
                Weight,
                Height,
                Blood_Pressure
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;


        db.query(
            insertSql,

            [
                patientId,
                name,
                age,
                gender,
                cardid,
                weight,
                height,
                bp
            ],

            (err) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }


                // Make this patient the active patient for this doctor
                try {
                    activePatient.setActivePatient(doctorId, {
                        patientId,
                        name,
                        age,
                        gender
                    });
                } catch (error) {
                    console.error("Error setting active patient:", error);
                    // Still return success, but note the issue
                    return res.status(201).json({
                        patientId,
                        name,
                        age,
                        gender,
                        warning: "Patient created but could not set as active."
                    });
                }


                res.status(201).json({
                    patientId,
                    name,
                    age,
                    gender
                });

            }
        );

    });

});


// ============================================================
// LOAD PATIENT
// ============================================================

router.post("/load", (req, res) => {

    const { patientId, doctorId } = req.body;


    if (!patientId) {

        return res.status(400).json({
            error: "Patient ID is required."
        });

    }

    if (!doctorId) {

        return res.status(400).json({
            error: "doctorId is required."
        });

    }


    const sql = `
        SELECT *
        FROM patient_data
        WHERE patient_id = ?
    `;


    db.query(
        sql,
        [patientId],

        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Database error"
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    error: "Patient not found."
                });

            }


            const patient = results[0];


            // Set as active patient for this doctor

            try {
                console.log("Patient returned from database:", patient);
                console.log("Patient ID:", patient.patient_id);
                console.log("Doctor ID:", doctorId);

                activePatient.setActivePatient(doctorId, {
                    patientId: patient.patient_id,
                    name: patient.name,
                    age: patient.age,
                    gender: patient.Gender
                });

                console.log(
                    `Active patient set: ${patient.patient_id} for doctor ${doctorId}`
                );

            } catch (error) {
                console.error("Error setting active patient:", error);
            }


            res.json(patient);

        }
    );

});


// ============================================================
// GET ACTIVE PATIENT
// ============================================================

router.get("/active", (req, res) => {

    const { doctorId } = req.query;


    if (!doctorId) {

        return res.status(400).json({
            error: "doctorId is required as a query parameter."
        });

    }


    const patient = activePatient.getActivePatient(doctorId);


    if (!patient) {

        return res.status(404).json({
            error: "No active patient for this doctor."
        });

    }


    res.json(patient);

});


// ============================================================
// CLEAR ACTIVE PATIENT
// ============================================================

router.post("/clear", (req, res) => {

    const { doctorId } = req.body;


    if (!doctorId) {

        return res.status(400).json({
            error: "doctorId is required."
        });

    }


    activePatient.clearActivePatient(doctorId);


    res.json({
        message: "Active patient cleared successfully."
    });

});

module.exports = router;