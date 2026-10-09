const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../db/init');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'medisense_secret_key_change_in_prod';

// ── Auth middleware ───────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ success: false, message: 'No token provided.' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function ok(res, data)       { res.json({ success: true, ...data }); }
function err(res, msg, c=400){ res.status(c).json({ success: false, message: msg }); }

// ════════════════════════════════════════════════════════════
//  DOCTORS
// ════════════════════════════════════════════════════════════

// GET /api/doctors  — list all verified doctors
router.get('/doctors', (req, res) => {
  const rows = db.prepare(`
    SELECT id, full_name, specialization, experience_yrs, rating,
           consult_fee, bio, available_from, available_to
    FROM   doctors
    WHERE  is_verified = 1
    ORDER  BY rating DESC
  `).all();
  ok(res, { doctors: rows });
});

// GET /api/doctors/:id
router.get('/doctors/:id', (req, res) => {
  const doc = db.prepare(`
    SELECT id, full_name, specialization, experience_yrs, rating,
           consult_fee, bio, available_from, available_to
    FROM   doctors WHERE id = ? AND is_verified = 1
  `).get(req.params.id);
  if (!doc) return err(res, 'Doctor not found.', 404);
  ok(res, { doctor: doc });
});

// ════════════════════════════════════════════════════════════
//  APPOINTMENTS
// ════════════════════════════════════════════════════════════

// POST /api/appointments  — book (patient only)
router.post('/appointments', auth, (req, res) => {
  if (req.user.role !== 'patient')
    return err(res, 'Only patients can book appointments.');

  const { doctor_id, appt_date, appt_time, consult_type, symptoms_noted } = req.body;
  if (!doctor_id || !appt_date || !appt_time)
    return err(res, 'doctor_id, appt_date, appt_time are required.');

  // Conflict check: same doctor, same date+time, not cancelled
  const conflict = db.prepare(`
    SELECT id FROM appointments
    WHERE doctor_id = ? AND appt_date = ? AND appt_time = ?
      AND status NOT IN ('cancelled')
  `).get(doctor_id, appt_date, appt_time);
  if (conflict) return err(res, 'That slot is already booked. Please choose another time.');

  const stmt = db.prepare(`
    INSERT INTO appointments (patient_id, doctor_id, appt_date, appt_time, consult_type, symptoms_noted)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    req.user.id, doctor_id, appt_date, appt_time,
    consult_type || 'video', symptoms_noted || null
  );
  ok(res, { appointment_id: info.lastInsertRowid, message: 'Appointment booked successfully!' });
});

// GET /api/appointments/mine  — patient sees their own appointments
router.get('/appointments/mine', auth, (req, res) => {
  let rows;
  if (req.user.role === 'patient') {
    rows = db.prepare(`
      SELECT a.*, d.full_name AS doctor_name, d.specialization
      FROM   appointments a
      JOIN   doctors d ON d.id = a.doctor_id
      WHERE  a.patient_id = ?
      ORDER  BY a.appt_date DESC, a.appt_time DESC
    `).all(req.user.id);
  } else if (req.user.role === 'doctor') {
    rows = db.prepare(`
      SELECT a.*, p.full_name AS patient_name, p.phone AS patient_phone
      FROM   appointments a
      JOIN   patients p ON p.id = a.patient_id
      WHERE  a.doctor_id = ?
      ORDER  BY a.appt_date ASC, a.appt_time ASC
    `).all(req.user.id);
  } else {
    return err(res, 'Unauthorized.', 403);
  }
  ok(res, { appointments: rows });
});

// PATCH /api/appointments/:id/cancel
router.patch('/appointments/:id/cancel', auth, (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return err(res, 'Appointment not found.', 404);

  // Only the booking patient or the doctor can cancel
  const isOwner =
    (req.user.role === 'patient' && appt.patient_id === req.user.id) ||
    (req.user.role === 'doctor'  && appt.doctor_id  === req.user.id);
  if (!isOwner) return err(res, 'Not authorized.', 403);

  db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  ok(res, { message: 'Appointment cancelled.' });
});

// ════════════════════════════════════════════════════════════
//  SYMPTOM CHECKS (save history)
// ════════════════════════════════════════════════════════════

// POST /api/symptom-check
router.post('/symptom-check', (req, res) => {
  const { symptoms, diagnosis, severity, medicines } = req.body;
  if (!symptoms || !diagnosis) return err(res, 'symptoms and diagnosis are required.');

  // patient_id optional (guest users allowed)
  const patient_id = req.user?.id || null;

  const stmt = db.prepare(`
    INSERT INTO symptom_checks (patient_id, symptoms, diagnosis, severity, medicines)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(patient_id, symptoms, diagnosis, severity || null, JSON.stringify(medicines || []));
  ok(res, { message: 'Symptom check saved.' });
});

// GET /api/symptom-check/history  — patient's past checks
router.get('/symptom-check/history', auth, (req, res) => {
  if (req.user.role !== 'patient') return err(res, 'Patients only.', 403);
  const rows = db.prepare(`
    SELECT * FROM symptom_checks
    WHERE patient_id = ?
    ORDER BY created_at DESC LIMIT 20
  `).all(req.user.id);
  ok(res, { history: rows });
});

// ════════════════════════════════════════════════════════════
//  PROFILE
// ════════════════════════════════════════════════════════════

// GET /api/profile
router.get('/profile', auth, (req, res) => {
  if (req.user.role === 'patient') {
    const p = db.prepare(
      'SELECT id, full_name, email, phone, dob, gender, blood_group, created_at FROM patients WHERE id = ?'
    ).get(req.user.id);
    return ok(res, { profile: { ...p, role: 'patient' } });
  }
  const d = db.prepare(
    'SELECT id, full_name, email, phone, specialization, experience_yrs, rating, consult_fee, bio, is_verified, created_at FROM doctors WHERE id = ?'
  ).get(req.user.id);
  ok(res, { profile: { ...d, role: 'doctor' } });
});

module.exports = router;
