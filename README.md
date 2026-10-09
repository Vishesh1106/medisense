# 🏥 MediSense – AI-Powered Healthcare App

> Symptom checker · Doctor booking · Patient & Doctor accounts — backed by a real SQL database.

## 📁 Project Structure

```
medisense/
├── server.js              ← Express server (entry point)
├── package.json
├── db/
│   ├── schema.sql         ← All SQL table definitions
│   ├── init.js            ← Boots the SQLite database
│   └── medisense.db       ← Auto-created on first run
├── routes/
│   ├── auth.js            ← /api/auth/* (register, login)
│   └── api.js             ← /api/doctors, /api/appointments, etc.
└── public/
    └── index.html         ← Full frontend (HTML + CSS + JS)
```

## 🗄️ SQL Tables

| Table            | Purpose                                       |
|------------------|-----------------------------------------------|
| patients         | Patient accounts (bcrypt hashed passwords)    |
| doctors          | Doctor profiles and credentials               |
| appointments     | Booked slots linking patients and doctors     |
| symptom_checks   | AI symptom check history per patient          |

## ⚙️ Setup

```bash
npm install
node server.js
# Open http://localhost:3000
```

## 🔌 Key API Endpoints

POST /api/auth/patient/register  
POST /api/auth/patient/login  
POST /api/auth/doctor/register  
POST /api/auth/doctor/login  
GET  /api/doctors  
POST /api/appointments  (JWT required)  
GET  /api/appointments/mine  (JWT required)  
POST /api/symptom-check  
GET  /api/symptom-check/history  (JWT required)  

## 🔐 Security

- Passwords hashed with bcrypt
- Auth via JWT (7-day expiry)
- Double-booking conflict check in SQL
- Foreign keys enforced

## 🚀 Deploy

Set env vars: JWT_SECRET, PORT  
Works on Railway, Render, or Heroku.  
Frontend-only: upload public/index.html to GitHub Pages.
