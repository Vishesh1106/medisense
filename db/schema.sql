-- ============================================================
--  MediSense Database Schema
--  Engine: SQLite (swap to MySQL/PostgreSQL easily)
-- ============================================================

-- PATIENTS table
CREATE TABLE IF NOT EXISTS patients (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name   TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,          -- bcrypt hash
    phone       TEXT,
    dob         TEXT,                      -- YYYY-MM-DD
    gender      TEXT CHECK(gender IN ('male','female','other')),
    blood_group TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
);

-- DOCTORS table
CREATE TABLE IF NOT EXISTS doctors (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name      TEXT    NOT NULL,
    email          TEXT    NOT NULL UNIQUE,
    password       TEXT    NOT NULL,       -- bcrypt hash
    phone          TEXT,
    specialization TEXT    NOT NULL,
    experience_yrs INTEGER DEFAULT 0,
    rating         REAL    DEFAULT 5.0,
    consult_fee    INTEGER DEFAULT 500,    -- INR
    available_from TEXT    DEFAULT '09:00',
    available_to   TEXT    DEFAULT '18:00',
    bio            TEXT,
    is_verified    INTEGER DEFAULT 0,      -- 0=pending, 1=verified
    created_at     TEXT    DEFAULT (datetime('now'))
);

-- APPOINTMENTS table
CREATE TABLE IF NOT EXISTS appointments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id),
    doctor_id       INTEGER NOT NULL REFERENCES doctors(id),
    appt_date       TEXT    NOT NULL,      -- YYYY-MM-DD
    appt_time       TEXT    NOT NULL,      -- HH:MM
    consult_type    TEXT    CHECK(consult_type IN ('video','clinic','chat')) DEFAULT 'video',
    status          TEXT    CHECK(status IN ('pending','confirmed','cancelled','completed')) DEFAULT 'pending',
    symptoms_noted  TEXT,
    notes           TEXT,
    created_at      TEXT    DEFAULT (datetime('now'))
);

-- SYMPTOM CHECKS (history log)
CREATE TABLE IF NOT EXISTS symptom_checks (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id     INTEGER REFERENCES patients(id),  -- NULL if guest
    symptoms       TEXT    NOT NULL,                 -- comma-separated
    diagnosis      TEXT    NOT NULL,
    severity       TEXT,
    medicines      TEXT,                             -- JSON string
    created_at     TEXT    DEFAULT (datetime('now'))
);

-- ============================================================
--  Seed: sample doctors
-- ============================================================
INSERT OR IGNORE INTO doctors
    (full_name, email, password, phone, specialization, experience_yrs, rating, consult_fee, bio, is_verified)
VALUES
    ('Dr. Priya Sharma',  'priya@medisense.com',  '$2a$10$placeholder', '9800000001', 'General Physician',  12, 4.9, 499,  'MBBS, MD – General Medicine. Treats viral infections, lifestyle diseases.', 1),
    ('Dr. Arjun Mehta',   'arjun@medisense.com',  '$2a$10$placeholder', '9800000002', 'Internal Medicine',  9,  4.8, 599,  'MBBS, DNB – Internal Medicine. Expert in chronic & complex conditions.', 1),
    ('Dr. Sunita Rao',    'sunita@medisense.com',  '$2a$10$placeholder', '9800000003', 'Pulmonologist',      15, 5.0, 799,  'MD Pulmonology. Specialises in respiratory and lung disorders.', 1),
    ('Dr. Karan Batra',   'karan@medisense.com',   '$2a$10$placeholder', '9800000004', 'Neurologist',        11, 4.7, 899,  'DM Neurology. Expert in migraines, epilepsy, and nerve conditions.', 1),
    ('Dr. Meera Pillai',  'meera@medisense.com',   '$2a$10$placeholder', '9800000005', 'Cardiologist',       18, 4.9, 999,  'DM Cardiology. Treats heart disease, hypertension, and chest conditions.', 1),
    ('Dr. Rohit Joshi',   'rohit@medisense.com',   '$2a$10$placeholder', '9800000006', 'Dermatologist',      7,  4.6, 549,  'MD Dermatology. Treats skin, hair, and nail disorders.', 1),
    ('Dr. Anjali Singh',  'anjali@medisense.com',  '$2a$10$placeholder', '9800000007', 'Paediatrician',      13, 5.0, 649,  'MD Paediatrics. Child health specialist from newborn to 18 years.', 1),
    ('Dr. Vikram Nair',   'vikram@medisense.com',  '$2a$10$placeholder', '9800000008', 'Gastroenterologist', 10, 4.8, 749,  'DM Gastroenterology. Treats gut, liver, and digestive issues.', 1);
