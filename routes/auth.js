const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db/init');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'medisense_secret_key_change_in_prod';

// ── helpers ──────────────────────────────────────────────────
function makeToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

function ok(res, data)  { res.json({ success: true,  ...data }); }
function err(res, msg, code = 400) { res.status(code).json({ success: false, message: msg }); }

// ════════════════════════════════════════════════════════════
//  PATIENT ROUTES
// ════════════════════════════════════════════════════════════

// POST /api/auth/patient/register
router.post('/patient/register', (req, res) => {
  const { full_name, email, password, phone, dob, gender, blood_group } = req.body;

  if (!full_name || !email || !password)
    return err(res, 'Name, email and password are required.');

  // Check duplicate
  const exists = db.prepare('SELECT id FROM patients WHERE email = ?').get(email);
  if (exists) return err(res, 'Email already registered.');

  const hash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(`
    INSERT INTO patients (full_name, email, password, phone, dob, gender, blood_group)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(full_name, email, hash, phone || null, dob || null, gender || null, blood_group || null);

  const token = makeToken({ id: info.lastInsertRowid, role: 'patient', name: full_name });
  ok(res, { token, user: { id: info.lastInsertRowid, name: full_name, email, role: 'patient' } });
});

// POST /api/auth/patient/login
router.post('/patient/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return err(res, 'Email and password required.');

  const patient = db.prepare('SELECT * FROM patients WHERE email = ?').get(email);
  if (!patient || !bcrypt.compareSync(password, patient.password))
    return err(res, 'Invalid email or password.', 401);

  const token = makeToken({ id: patient.id, role: 'patient', name: patient.full_name });
  ok(res, {
    token,
    user: { id: patient.id, name: patient.full_name, email: patient.email, role: 'patient' }
  });
});

// ════════════════════════════════════════════════════════════
//  DOCTOR ROUTES
// ════════════════════════════════════════════════════════════

// POST /api/auth/doctor/register
router.post('/doctor/register', (req, res) => {
  const { full_name, email, password, phone, specialization, experience_yrs, consult_fee, bio } = req.body;

  if (!full_name || !email || !password || !specialization)
    return err(res, 'Name, email, password and specialization are required.');

  const exists = db.prepare('SELECT id FROM doctors WHERE email = ?').get(email);
  if (exists) return err(res, 'Email already registered.');

  const hash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(`
    INSERT INTO doctors (full_name, email, password, phone, specialization, experience_yrs, consult_fee, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    full_name, email, hash, phone || null,
    specialization, experience_yrs || 0,
    consult_fee || 500, bio || null
  );

  const token = makeToken({ id: info.lastInsertRowid, role: 'doctor', name: full_name });
  ok(res, { token, user: { id: info.lastInsertRowid, name: full_name, email, role: 'doctor', specialization } });
});

// POST /api/auth/doctor/login
router.post('/doctor/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return err(res, 'Email and password required.');

  const doctor = db.prepare('SELECT * FROM doctors WHERE email = ?').get(email);
  if (!doctor || !bcrypt.compareSync(password, doctor.password))
    return err(res, 'Invalid email or password.', 401);

  const token = makeToken({ id: doctor.id, role: 'doctor', name: doctor.full_name });
  ok(res, {
    token,
    user: {
      id: doctor.id, name: doctor.full_name, email: doctor.email,
      role: 'doctor', specialization: doctor.specialization,
      is_verified: doctor.is_verified
    }
  });
});

module.exports = router;
