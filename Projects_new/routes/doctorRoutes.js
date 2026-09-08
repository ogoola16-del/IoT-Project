const express = require("express");
const router = express.Router();

const db = require("../db");
const verificationService = require("../services/verificationService");
const emailService = require("../services/emailService");


// =========================
// DOCTOR REGISTRATION
// =========================

router.post("/signup", (req, res) => {

    const {
        organization_id,
        name,
        email,
        password
    } = req.body;


    // =========================
    // CHECK REQUIRED FIELDS
    // =========================

    if (
        !organization_id ||
        !name ||
        !email ||
        !password
    ) {

        return res.status(400).json({
            error:
                "Organization, name, email and password are required."
        });

    }


    // =========================
    // CHECK ORGANIZATION EXISTS
    // =========================

    const checkOrganization = `
        SELECT organization_id
        FROM organizations
        WHERE organization_id = ?
    `;

    db.query(
        checkOrganization,
        [organization_id],
        (err, organization) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Database error."
                });

            }


            if (organization.length === 0) {

                return res.status(404).json({
                    error: "Organization not found."
                });

            }


            // =========================
            // CHECK DOCTOR EXISTS
            // =========================

            const checkDoctor = `
                SELECT doctor_id, is_verified
                FROM doctors
                WHERE organization_id = ?
                AND email = ?
            `;

            db.query(
                checkDoctor,
                [
                    organization_id,
                    email
                ],
                (err, doctors) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            error: "Database error."
                        });

                    }


                    if (doctors.length > 0) {

                        return res.status(409).json({
                            error:
                                "A doctor with this email already exists in this organization."
                        });

                    }


                    // =========================
                    // GENERATE DOCTOR ID
                    // =========================

                    const getLastDoctorId = `
                        SELECT doctor_id
                        FROM doctors
                        WHERE doctor_id LIKE 'DOCE%'
                        ORDER BY
                            CAST(
                                SUBSTRING(doctor_id, 5)
                                AS INTEGER
                            ) DESC
                        LIMIT 1
                    `;


                    db.query(
                        getLastDoctorId,
                        (err, results) => {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({
                                    error:
                                        "Could not generate doctor ID."
                                });

                            }


                            let doctorId = "DOCE0001";


                            if (results.length > 0) {

                                const lastId =
                                    results[0].doctor_id;

                                const lastNumber =
                                    parseInt(
                                        lastId.replace("DOCE", ""),
                                        10
                                    );

                                doctorId =
                                    "DOCE" +
                                    String(lastNumber + 1)
                                        .padStart(4, "0");

                            }


                            // =========================
                            // CREATE DOCTOR (with is_verified = 0)
                            // =========================

                            const sql = `
                                INSERT INTO doctors
                                (
                                    doctor_id,
                                    organization_id,
                                    name,
                                    email,
                                    password,
                                    is_verified
                                )
                                VALUES (?, ?, ?, ?, ?, ?)
                            `;


                            db.query(
                                sql,
                                [
                                    doctorId,
                                    organization_id,
                                    name,
                                    email,
                                    password,
                                    false  // Not verified yet
                                ],
                                async (err) => {

                                    if (err) {

                                        console.error(err);

                                        return res.status(500).json({
                                            error:
                                                "Could not create doctor."
                                        });

                                    }


                                    // =========================
                                    // GENERATE AND SEND VERIFICATION CODE
                                    // =========================

                                    try {
                                        const code = verificationService.generateCode();
                                        
                                        // Store the code in database
                                        await verificationService.storeVerificationCode(email, code);
                                        
                                        // Send verification code via email (simulated)
                                        await emailService.sendVerificationCode(email, code);

                                        // =========================
                                        // SUCCESS
                                        // =========================

                                        res.status(201).json({

                                            message: 
                                                "Doctor registered successfully. " +
                                                "A verification code has been sent to your email.",
                                            
                                            doctor: {

                                                doctor_id: doctorId,

                                                organization_id,

                                                name,

                                                email,

                                                is_verified: false

                                            },

                                            requiresVerification: true

                                        });

                                    } catch (error) {
                                        console.error("Error sending verification code:", error);
                                        
                                        // Still return success, but note the verification issue
                                        res.status(201).json({

                                            message: 
                                                "Doctor registered but verification email could not be sent. " +
                                                "Please contact support.",
                                            
                                            doctor: {

                                                doctor_id: doctorId,

                                                organization_id,

                                                name,

                                                email,

                                                is_verified: false

                                            },

                                            requiresVerification: true,
                                            verificationError: true

                                        });
                                    }

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// =========================
// VERIFY CODE
// =========================

router.post("/verify-code", (req, res) => {

    const { email, code } = req.body;

    // =========================
    // CHECK REQUIRED FIELDS
    // =========================

    if (!email || !code) {

        return res.status(400).json({
            error: "Email and verification code are required."
        });

    }

    // =========================
    // VERIFY THE CODE
    // =========================

    verificationService.verifyCode(email, code)
        .then((result) => {

            // Code is WRONG or INVALID
            if (!result.valid) {

                return res.status(400).json({
                    error: result.message
                });

            }

            // =========================
            // CODE IS CORRECT
            // =========================

            const updateSql = `
                UPDATE doctors
                SET is_verified = TRUE
                WHERE email = ?
            `;

            db.query(updateSql, [email], (err, updateResult) => {

                if (err) {

                    console.error(
                        "Error updating doctor verification status:",
                        err
                    );

                    return res.status(500).json({
                        error: "Could not update verification status."
                    });

                }

                if (updateResult.affectedRows === 0) {

                    return res.status(404).json({
                        error: "Doctor not found with this email."
                    });

                }

                // =========================
                // GET DOCTOR INFORMATION
                // =========================

                const selectSql = `
                    SELECT
                        doctor_id,
                        organization_id,
                        name,
                        email
                    FROM doctors
                    WHERE email = ?
                `;

                db.query(
                    selectSql,
                    [email],
                    (err, results) => {

                        if (err) {

                            console.error(
                                "Error fetching doctor details:",
                                err
                            );

                            return res.status(500).json({
                                error: "Could not fetch doctor details."
                            });

                        }

                        res.status(200).json({

                            message:
                                "Email verified successfully! You can now log in.",

                            doctor: results[0]

                        });

                    }
                );

            });

        })
        .catch((err) => {

            console.error("Verification error:", err);

            return res.status(500).json({
                error: "An error occurred during verification."
            });

        });

});

// =========================
// RESEND CODE
// =========================

// In-memory rate limiting for resend requests
const resendRateLimit = new Map(); // email -> timestamp

router.post("/resend-code", (req, res) => {

    const { email } = req.body;


    // =========================
    // CHECK REQUIRED FIELDS
    // =========================

    if (!email) {

        return res.status(400).json({
            error: "Email is required."
        });

    }


    // =========================
    // RATE LIMIT CHECK (60 seconds)
    // =========================

    const lastResend = resendRateLimit.get(email);
    const now = Date.now();

    if (lastResend && (now - lastResend) < 60000) {

        const remainingSeconds = Math.ceil((60000 - (now - lastResend)) / 1000);

        return res.status(429).json({
            error: `Please wait ${remainingSeconds} seconds before requesting another code.`
        });

    }


    // =========================
    // CHECK IF DOCTOR EXISTS
    // =========================

    const checkDoctorSql = `
        SELECT email, is_verified
        FROM doctors
        WHERE email = ?
    `;

    db.query(checkDoctorSql, [email], (err, results) => {

        if (err) {

            console.error("Error checking doctor existence:", err);

            return res.status(500).json({
                error: "Database error."
            });

        }


        if (results.length === 0) {

            return res.status(404).json({
                error: "No doctor found with this email."
            });

        }


        if (results[0].is_verified === true || results[0].is_verified === 1) {

            return res.status(400).json({
                error: "This email is already verified."
            });

        }


        // =========================
        // GENERATE NEW CODE
        // =========================

        verificationService.resendVerificationCode(email)
            .then((result) => {

                // Send new code via email (simulated)
                emailService.sendVerificationCode(email, result.code)
                    .then(() => {

                        // Update rate limit
                        resendRateLimit.set(email, Date.now());

                        res.status(200).json({
                            message: "A new verification code has been sent to your email."
                        });

                    })
                    .catch((error) => {

                        console.error("Error sending verification email:", error);

                        return res.status(500).json({
                            error: "Could not send verification email. Please try again later."
                        });

                    });

            })
            .catch((err) => {

                console.error("Error resending verification code:", err);

                return res.status(500).json({
                    error: "Could not generate verification code."
                });

            });

    });

});


// =========================
// DOCTOR LOGIN
// =========================

router.post("/login", (req, res) => {

    const {
        doctor_id,
        password
    } = req.body;


    // =========================
    // CHECK REQUIRED FIELDS
    // =========================

    if (!doctor_id || !password) {

        return res.status(400).json({
            error: "Doctor ID and password are required."
        });

    }


    // =========================
    // FIND DOCTOR
    // =========================

    const sql = `
        SELECT
            doctor_id,
            organization_id,
            name,
            email,
            password,
            is_verified
        FROM doctors
        WHERE doctor_id = ?
    `;


    db.query(
        sql,
        [doctor_id],
        (err, results) => {

            if (err) {

                console.error(
                    "Doctor login error:",
                    err
                );

                return res.status(500).json({
                    error: "Server error during login."
                });

            }


            // =========================
            // DOCTOR NOT FOUND
            // =========================

            if (results.length === 0) {

                return res.status(401).json({
                    error: "Invalid Doctor ID or password."
                });

            }


            const doctor = results[0];


            // =========================
            // CHECK PASSWORD
            // =========================

            if (password !== doctor.password) {

                return res.status(401).json({
                    error: "Invalid Doctor ID or password."
                });

            }


            // =========================
            // CHECK VERIFICATION STATUS
            // =========================

            if (doctor.is_verified === false || doctor.is_verified === 0) {

                return res.status(403).json({
                    error: 
                        "Please verify your email first. " +
                        "A verification code was sent to your email when you registered.",
                    requiresVerification: true,
                    email: doctor.email
                });

            }


            // =========================
            // LOGIN SUCCESSFUL
            // =========================

            res.status(200).json({

                message: "Login successful.",

                doctor: {

                    doctor_id:
                        doctor.doctor_id,

                    organization_id:
                        doctor.organization_id,

                    name:
                        doctor.name,

                    email:
                        doctor.email

                }

            });

        }
    );

});


// =========================
// GET CURRENT DOCTOR
// =========================

router.get("/current", (req, res) => {

    const { doctorId } = req.query;


    // =========================
    // CHECK REQUIRED FIELDS
    // =========================

    if (!doctorId) {

        return res.status(400).json({
            error: "doctorId is required as a query parameter."
        });

    }


    // =========================
    // FIND DOCTOR
    // =========================

    const sql = `
        SELECT
            doctor_id,
            organization_id,
            name,
            email,
            is_verified
        FROM doctors
        WHERE doctor_id = ?
    `;

    db.query(sql, [doctorId], (err, results) => {

        if (err) {

            console.error("Error fetching doctor:", err);

            return res.status(500).json({
                error: "Database error."
            });

        }


        if (results.length === 0) {

            return res.status(404).json({
                error: "Doctor not found."
            });

        }


        res.status(200).json({
            doctor: results[0]
        });

    });

});

module.exports = router;