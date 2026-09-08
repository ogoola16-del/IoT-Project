const express = require("express");
const router = express.Router();
const db = require("../db");

// ============================================================
// SENSOR CONFIGURATION
// ============================================================

const sensorConfig = {
  ecg: {
    table: "ecg_packets",
    column: "ecg_values",
    packet: true,
  },
  spo2: {
    table: "vitals_data",
    column: "spo2",
  },
  bpm: {
    table: "vitals_data",
    column: "bpm",
  },
  aq: {
    table: "vitals_data",
    column: "Air_Quality",
  },
  hum: {
    table: "vitals_data",
    column: "humidity",
  },
  roomTemp: {
    table: "vitals_data",
    column: "temperature",
  },
  body_temp: {
    table: "vitals_data",
    column: "bodyTemp",
  },
};

// ============================================================
// GET SENSOR HISTORY
// ============================================================

router.get("/:type", (req, res) => {
  const { type } = req.params;
  const date = req.query.date;
  const patientId = req.query.patientId;
  const limit = parseInt(req.query.limit, 10) || 500;

  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  const config = sensorConfig[type];
  if (!config) {
    return res.status(400).json({ error: "Invalid sensor type" });
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
      WHERE patient_id = $1
      AND DATE(created_at) = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    db.query(sql, [patientId, date, limit], (err, results) => {
      if (err) {
        console.error("ECG history error:", err);
        return res.status(500).json({ error: "Database error", detail: err.message });
      }

      const expanded = [];

      // Newest packets first → reverse so oldest comes first
      results.reverse().forEach((packet) => {
        let samples;
        try {
          samples =
            typeof packet.ecg_values === "string"
              ? JSON.parse(packet.ecg_values)
              : packet.ecg_values;
        } catch (error) {
          console.error("Invalid ECG JSON:", error);
          return;
        }

        if (!Array.isArray(samples)) {
          console.error("ECG packet is not an array");
          return;
        }

        samples.forEach((value) => {
          expanded.push({
            value: value,
            created_at: packet.created_at,
          });
        });
      });

      res.json(expanded);
    });

    return;
  }

  // ============================================================
  // NORMAL SENSOR HISTORY
  // ============================================================
  // Note: column names with mixed case need quoting in Postgres
  const col = config.column;
  const quotedCol =
    col === "Air_Quality" || col === "bodyTemp" ? `"${col}"` : col;

  const sql = `
    SELECT *
    FROM (
      SELECT
        ${quotedCol} AS value,
        created_at
      FROM ${config.table}
      WHERE patient_id = $1
      AND DATE(created_at) = $2
      AND ${quotedCol} IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $3
    ) AS recent
    ORDER BY created_at ASC
  `;

  db.query(sql, [patientId, date, limit], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error", detail: err.message });
    }
    res.json(results);
  });
});

module.exports = router;
