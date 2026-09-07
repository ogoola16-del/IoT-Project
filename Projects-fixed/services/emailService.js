// ============================================================
// EMAIL SERVICE (Simulated)
// ============================================================

/**
 * Send a verification code to an email address
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @returns {Promise<void>}
 */
function sendVerificationCode(email, code) {
    return new Promise((resolve) => {
        // Log the verification code to console for development
        console.log(`[EMAIL] Verification code for ${email}: ${code}`);
        console.log(`[EMAIL] This code will expire in 5 minutes.`);

        // Simulate email sending delay
        setTimeout(() => {
            resolve();
        }, 500);
    });
}

/**
 * Send a welcome email after verification
 * @param {string} email - Recipient email address
 * @param {string} name - Doctor's name
 * @returns {Promise<void>}
 */
function sendWelcomeEmail(email, name) {
    return new Promise((resolve) => {
        console.log(`[EMAIL] Welcome email sent to ${email} for Dr. ${name}`);
        console.log(`[EMAIL] Your ELAZ account has been successfully verified!`);

        setTimeout(() => {
            resolve();
        }, 300);
    });
}

// For production, uncomment and configure nodemailer:
/*
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function sendVerificationCode(email, code) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'ELAZ: Email Verification Code',
        html: `
            <h1>Welcome to ELAZ Health & Environment</h1>
            <p>Your verification code is:</p>
            <h2 style="color: #1677a8; font-size: 32px; letter-spacing: 4px;">${code}</h2>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };

    return transporter.sendMail(mailOptions);
}
*/

module.exports = {
    sendVerificationCode,
    sendWelcomeEmail
};