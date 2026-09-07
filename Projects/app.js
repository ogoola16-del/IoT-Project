const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

const backupDatabase = require("./backup");

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());
app.use(cors());

app.use(
  express.static(path.join(__dirname, "public"))
);

// =========================
// ROUTES
// =========================

const organizationRoutes = require("./routes/organizationRoutes");
const patientRoutes = require("./routes/patientRoutes");
const patientsRoutes = require("./routes/patientsRoutes");
const historyRoutes = require("./routes/historyRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const commentRoutes = require("./routes/commentRoutes");

app.use("/api/organization", organizationRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api", commentRoutes);

// =========================
// HOME PAGE
// =========================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// =========================
// MQTT
// Only start on a persistent process (not ideal on pure serverless)
// Set SKIP_MQTT=1 on Vercel if you host MQTT elsewhere
// =========================

if (process.env.SKIP_MQTT !== "1") {
  try {
    require("./mqtt");
  } catch (err) {
    console.warn("MQTT module failed to load:", err.message);
  }
}

// =========================
// START SERVER (local / long-running hosts)
// On Vercel the platform calls the exported app
// =========================

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // DATABASE BACKUP on graceful shutdown (local only)
  process.on("SIGINT", () => {
    console.log("\nCreating database backup...");
    backupDatabase();
    setTimeout(() => {
      console.log("Goodbye.");
      process.exit();
    }, 2000);
  });
}

// Export for Vercel / serverless
module.exports = app;
