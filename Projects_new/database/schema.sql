-- ============================================================
-- PostgreSQL Schema for ECG Backend
-- Compatible with Neon / Vercel Postgres / Supabase / local
-- ============================================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    organization_id VARCHAR(20) PRIMARY KEY,
    organization_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id VARCHAR(20) PRIMARY KEY,
    organization_id VARCHAR(20) NOT NULL REFERENCES organizations(organization_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, email)
);

-- Patients
CREATE TABLE IF NOT EXISTS patient_data (
    patient_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    age INTEGER,
    "Gender" VARCHAR(20),
    "Hospital_CardId" VARCHAR(50),
    "Weight" VARCHAR(20),
    "Height" VARCHAR(20),
    "Blood_Pressure" VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ECG packets (JSON array of samples)
CREATE TABLE IF NOT EXISTS ecg_packets (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patient_data(patient_id)
        ON DELETE CASCADE,
    ecg_values JSONB NOT NULL,
    sample_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecg_patient_created
    ON ecg_packets (patient_id, created_at DESC);

-- Vitals data
CREATE TABLE IF NOT EXISTS vitals_data (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patient_data(patient_id)
        ON DELETE CASCADE,
    temperature VARCHAR(20),
    humidity VARCHAR(20),
    "Air_Quality" VARCHAR(20),
    bpm VARCHAR(20),
    spo2 VARCHAR(20),
    "bodyTemp" VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient_created
    ON vitals_data (patient_id, created_at DESC);

-- Doctor comments
CREATE TABLE IF NOT EXISTS doctor_comments (
    id SERIAL PRIMARY KEY,
    doctor_id VARCHAR(20) NOT NULL REFERENCES doctors(doctor_id)
        ON DELETE CASCADE,
    patient_id VARCHAR(20) NOT NULL REFERENCES patient_data(patient_id)
        ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_patient
    ON doctor_comments (patient_id, created_at DESC);

-- Email verification codes
CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email
    ON email_verifications (email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code
    ON email_verifications (code);
