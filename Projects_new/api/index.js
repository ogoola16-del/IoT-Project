let app;
try {
  app = require("../app");
} catch (err) {
  console.error("Failed to load app:", err);
  // Minimal fallback so Vercel still returns something useful
  module.exports = (req, res) => {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "App failed to load",
      detail: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    }));
  };
  return;
}

module.exports = app;
