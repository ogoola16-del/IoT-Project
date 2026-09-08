const crypto = require("crypto");
const db = require("../db");

// ============================================================
// VERIFICATION SERVICE (PostgreSQL)
// ============================================================

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Store verification code in database
 * @param {string} email - User's email
 * @param {string} code - 6-digit verification code
 * @returns {Promise<void>}
 */
function storeVerificationCode(email, code) {
  return new Promise((resolve, reject) => {
    // First, delete any existing codes for this email
    const deleteSql = `
      DELETE FROM email_verifications
      WHERE email = $1
    `;

    db.query(deleteSql, [email], (err) => {
      if (err) {
        console.error("Error deleting old verification codes:", err);
        return reject(err);
      }

      // Insert new code with 5-minute expiration (Postgres interval syntax)
      const insertSql = `
        INSERT INTO email_verifications
        (email, code, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
      `;

      db.query(insertSql, [email, code], (err) => {
        if (err) {
          console.error("Error storing verification code:", err);
          return reject(err);
        }
        resolve();
      });
    });
  });
}

/**
 * Verify a code for a given email
 * @param {string} email - User's email
 * @param {string} code - 6-digit verification code
 * @returns {Promise<{valid: boolean, message: string}>}
 */
function verifyCode(email, code) {
  return new Promise((resolve, reject) => {
    // First, delete expired codes
    const cleanupSql = `
      DELETE FROM email_verifications
      WHERE expires_at < NOW()
    `;

    db.query(cleanupSql, (err) => {
      if (err) {
        console.error("Error cleaning expired codes:", err);
        return reject(err);
      }

      // Check if code exists, matches, and is not expired
      const selectSql = `
        SELECT id, email, code, expires_at
        FROM email_verifications
        WHERE email = $1
        AND code = $2
        AND expires_at > NOW()
      `;

      db.query(selectSql, [email, code], (err, results) => {
        if (err) {
          console.error("Error verifying code:", err);
          return reject(err);
        }

        if (results.length === 0) {
          // Check if there's a code for this email at all
          const checkSql = `
            SELECT id
            FROM email_verifications
            WHERE email = $1
          `;

          db.query(checkSql, [email], (err, checkResults) => {
            if (err) {
              console.error("Error checking for existing code:", err);
              return reject(err);
            }

            if (checkResults.length === 0) {
              resolve({
                valid: false,
                message:
                  "No verification code found for this email. Please request a new code.",
              });
            } else {
              resolve({
                valid: false,
                message:
                  "Invalid or expired verification code. Please request a new code.",
              });
            }
          });
          return;
        }

        // Code is valid - delete it after use
        const deleteSql = `
          DELETE FROM email_verifications
          WHERE id = $1
        `;

        db.query(deleteSql, [results[0].id], (err) => {
          if (err) {
            console.error("Error deleting used verification code:", err);
            // Continue anyway - don't reject
          }

          resolve({
            valid: true,
            message: "Email verified successfully.",
          });
        });
      });
    });
  });
}

/**
 * Resend verification code
 * @param {string} email - User's email
 * @returns {Promise<{code: string}>}
 */
function resendVerificationCode(email) {
  return new Promise((resolve, reject) => {
    const code = generateCode();

    // Delete existing codes and store new one
    const deleteSql = `
      DELETE FROM email_verifications
      WHERE email = $1
    `;

    db.query(deleteSql, [email], (err) => {
      if (err) {
        console.error("Error deleting old codes for resend:", err);
        return reject(err);
      }

      const insertSql = `
        INSERT INTO email_verifications
        (email, code, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
      `;

      db.query(insertSql, [email, code], (err) => {
        if (err) {
          console.error("Error storing new verification code:", err);
          return reject(err);
        }

        resolve({ code });
      });
    });
  });
}

/**
 * Check if an email is verified
 * @param {string} email - User's email
 * @returns {Promise<boolean>}
 */
function isEmailVerified(email) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT is_verified
      FROM doctors
      WHERE email = $1
    `;

    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error("Error checking verification status:", err);
        return reject(err);
      }

      if (results.length === 0) {
        resolve(false);
        return;
      }

      // Postgres returns boolean true/false (not 0/1)
      resolve(results[0].is_verified === true || results[0].is_verified === 1);
    });
  });
}

module.exports = {
  generateCode,
  storeVerificationCode,
  verifyCode,
  resendVerificationCode,
  isEmailVerified,
};
