/**
 * ============================================================
 * FILE: js/config.js
 * PURPOSE: Central configuration for the frontend.
 *
 * HOW TO EXPLAIN:
 * This is the first JS file loaded. It defines the API URL
 * so all other files know where to send requests. If you
 * deploy the backend to a real server, you only change it
 * here in ONE place — not in 10 different files.
 * ============================================================
 */

// The base URL of the backend API.
// In development: http://localhost:5000/api
// In production: https://api.yourdomain.com/api
const API_BASE_URL = 'http://localhost:5000/api';

// App-wide constants
const APP_CONFIG = {
  appName:       'MediSense',
  toastDuration: 3000,       // How long (ms) toast messages stay visible
  maxSymptoms:   20,         // Maximum symptoms a user can enter
  slotDays:      7,          // How many future days to show in booking
};

// Avatar color pairs for doctor cards (background + text color)
// Used to make each doctor card look unique
const AVATAR_COLORS = [
  { bg: '#d6f5eb', text: '#085041' },  // Green
  { bg: '#dbeafe', text: '#1e40af' },  // Blue
  { bg: '#fce7f3', text: '#9d174d' },  // Pink
  { bg: '#fef3c7', text: '#92400e' },  // Amber
  { bg: '#d1fae5', text: '#065f46' },  // Teal
  { bg: '#ede9fe', text: '#5b21b6' },  // Purple
];
