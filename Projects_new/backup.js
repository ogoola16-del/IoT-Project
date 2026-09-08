/**
 * Database backup helper.
 * On managed Postgres (Neon, Vercel Postgres, Supabase) use the provider's
 * built-in backup / point-in-time recovery instead of local dumps.
 */
function backupDatabase() {
  console.log(
    "Backup skipped: use your Postgres provider (Neon / Vercel / Supabase) backup tools."
  );
}

module.exports = backupDatabase;
