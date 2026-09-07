const express = require("express");
const router = express.Router();

const db = require("../db");


// ============================================================
// SENSOR CONFIGURATION
// ============================================================

const sensorConfig = {

    // ECG is stored as packets
    ecg: {
        table: "ecg_packets",
        column: "ecg_values",
        packet: true
    },

    // Other sensors are stored normally
    spo2: {
        table: "vitals_data",
        column: "spo2"
    },

    bpm: {
        table: "vitals_data",
        column: "bpm"
    },

    aq: {
        table: "vitals_data",
        column: "Air_Quality"
    },

    hum: {
        table: "vitals_data",
        column: "humidity"
    },

    roomTemp: {
        table: "vitals_data",
        column: "temperature"
    },

    body_temp: {
        table: "vitals_data",
        column: "bodyTemp"
    }

};


// ============================================================
// GET SENSOR HISTORY
// ============================================================

router.get("/:type", (req, res) => {

    const { type } = req.params;

    const date = req.query.date;

    const patientId = req.query.patientId;

    const limit =
        parseInt(req.query.limit) || 500;


    // ========================================================
    // VALIDATE DATE
    // ========================================================

    if (!date) {

        return res.status(400).json({
            error: "Date is required"
        });

    }


    // ========================================================
    // GET SENSOR CONFIGURATION
    // ========================================================

    const config = sensorConfig[type];


    if (!config) {

        return res.status(400).json({
            error: "Invalid sensor type"
        });

    }


    // ========================================================
    // ECG PACKET HISTORY
    // ========================================================

    if (config.packet) {

        const sql = `
            SELECT
                ecg_values,
                created_at
            FROM ${config.table}
            WHERE patient_id = ?
            AND DATE(created_at) = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;


        db.query(
            sql,
            [patientId, date, limit],

            (err, results) => {

                if (err) {

                    console.error(
                        "ECG history error:",
                        err
                    );

                    return res.status(500).json({
                        error: "Database error"
                    });

                }


                // =================================================
                // EXPAND PACKETS INTO INDIVIDUAL ECG VALUES
                // =================================================

                const expanded = [];


                // We selected newest packets first.
                // Reverse them so the oldest packet comes first.
                results.reverse().forEach(packet => {

                    let samples;


                    try {

                        samples =
                            typeof packet.ecg_values === "string"
                                ? JSON.parse(packet.ecg_values)
                                : packet.ecg_values;

                    } catch (error) {

                        console.error(
                            "Invalid ECG JSON:",
                            error
                        );

                        return;
                    }


                    // Make sure JSON contains an array
                    if (!Array.isArray(samples)) {

                        console.error(
                            "ECG packet is not an array"
                        );

                        return;
                    }


                    // Put every ECG sample into the response
                    samples.forEach(value => {

                        expanded.push({

                            value: value,

                            created_at:
                                packet.created_at

                        });

                    });

                });


                // =================================================
                // RETURN ECG DATA
                // =================================================

                res.json(expanded);

            }
        );


        // IMPORTANT:
        // Stop here so the normal sensor query below
        // doesn't execute for ECG.
        return;
    }


    // ============================================================
    // NORMAL SENSOR HISTORY
    // ============================================================

    const sql = `
        SELECT *
        FROM (
            SELECT
                ${config.column} AS value,
                created_at
            FROM ${config.table}
            WHERE patient_id = ?
            AND DATE(created_at) = ?
            AND ${config.column} IS NOT NULL
            ORDER BY created_at DESC
            LIMIT ?
        ) AS recent
        ORDER BY created_at ASC
    `;


    db.query(
        sql,
        [patientId, date, limit],

        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Database error"
                });

            }


            res.json(results);

        }
    );

});


module.exports = router;