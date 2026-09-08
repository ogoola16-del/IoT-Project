const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/organization", require("./routes/organizationRoutes"));
app.use("/api/doctor", require("./routes/doctorRoutes"));
app.use("/api/patient", require("./routes/patientRoutes"));
app.use("/api/patients", require("./routes/patientsRoutes"));
app.use("/api/history", require("./routes/historyRoutes"));
app.use("/api", require("./routes/commentRoutes"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check - never throws
app.get("/health", async (req, res) => {
  try {
    const db = require("./db");
    await db.query("SELECT 1 AS ok");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error("Health DB error:", err);
    res.status(500).json({
      status: "error",
      database: "disconnected",
      detail: err.message || String(err),
    });
  }
});

// MQTT only outside Vercel and only if not skipped
const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
if (!isVercel && process.env.SKIP_MQTT !== "1") {
  try {
    require("./mqtt");
  } catch (err) {
    console.warn("MQTT failed to load:", err.message);
  }
}

// Local server only
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
