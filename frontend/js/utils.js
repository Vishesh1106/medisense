/**
 * ============================================================
 * FILE: js/utils.js
 * PURPOSE: Reusable helper functions used across all JS files.
 *
 * HOW TO EXPLAIN:
 * Instead of copying the same code into multiple files,
 * we write functions once here and call them from anywhere.
 * This is the DRY principle — "Don't Repeat Yourself".
 * ============================================================
 */


/**
 * Makes an API call to the backend.
 * Automatically attaches the JWT token from localStorage.
 *
 * @param {string} method  - 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'
 * @param {string} path    - e.g. '/auth/login' or '/doctors?specialty=ENT'
 * @param {object} body    - Request body (for POST/PUT requests)
 * @param {boolean} auth   - Whether to attach the JWT token (default: true)
 * @returns {object}       - Parsed JSON response from the backend
 */
async function apiCall(method, path, body = null, auth = true) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // If this is a protected route, attach the saved JWT token
  if (auth) {
    const token = localStorage.getItem('ms_token');
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
  }

  // Attach the request body for POST/PUT/PATCH
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(API_BASE_URL + path, options);
    const data = await response.json();

    // If token expired (401), log the user out automatically
    if (response.status === 401) {
      handleLogout();
      return { success: false, message: 'Session expired. Please login again.' };
    }

    return data;
  } catch (error) {
    // Network error — backend is probably not running
    console.error('API call failed:', error);
    return {
      success: false,
      message: 'Cannot connect to server. Please check your connection.',
    };
  }
}


/**
 * Shows a toast notification at the bottom of the screen.
 *
 * @param {string}  message  - The message to show
 * @param {boolean} isError  - If true, shows a red error toast
 */
function showToast(message, isError = false) {
  const toast   = document.getElementById('toast');
  const msgEl   = document.getElementById('toast-message');
  const iconEl  = document.getElementById('toast-icon');

  if (!toast || !msgEl) return;

  // Set the message and icon
  msgEl.textContent  = message;
  iconEl.className   = isError ? 'ti ti-alert-circle' : 'ti ti-check';

  // Set color: red for error, green for success
  toast.className = 'toast show' + (isError ? ' error' : '');

  // Hide after 3 seconds
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, APP_CONFIG.toastDuration);
}


/**
 * Converts a 24-hour time string to 12-hour format.
 * Example: "14:30" → "2:30 PM"
 *
 * @param {string} time24  - Time in "HH:MM" format
 * @returns {string}       - Time in "H:MM AM/PM" format
 */
function formatTime12h(time24) {
  const [hourStr, minuteStr] = time24.split(':');
  const hour   = parseInt(hourStr);
  const minute = minuteStr;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;  // 0 becomes 12 (midnight), 13 becomes 1, etc.
  return `${hour12}:${minute} ${period}`;
}


/**
 * Formats a date string into a readable format.
 * Example: "2025-12-25" → "Thu, 25 Dec 2025"
 *
 * @param {string} dateStr  - Date in "YYYY-MM-DD" format
 * @returns {string}        - Human-readable date
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
    year:    'numeric',
  });
}


/**
 * Gets today's date as a string in "YYYY-MM-DD" format.
 * Used for date comparisons and default date values.
 *
 * @returns {string} - e.g. "2025-09-15"
 */
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}


/**
 * Gets the user's initials from their name.
 * Example: "Rahul Sharma" → "RS"
 *
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string} - Two uppercase initials
 */
function getInitials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
}


/**
 * Gets a color pair (background + text) for an avatar.
 * Cycles through AVATAR_COLORS array based on index.
 *
 * @param {number} index  - Usually the position in a list
 * @returns {object}      - { bg: '#color', text: '#color' }
 */
function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}


/**
 * Saves a value to localStorage.
 * localStorage is the browser's built-in key-value storage.
 * Data persists even when the user closes the tab.
 *
 * @param {string} key    - Storage key name
 * @param {any}    value  - Any value (gets JSON-serialized)
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }
}


/**
 * Reads a value from localStorage.
 * Returns null if the key doesn't exist.
 *
 * @param {string} key  - Storage key name
 * @returns {any}       - Parsed value, or null
 */
function getFromStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}


/**
 * Removes a value from localStorage.
 *
 * @param {string} key  - Storage key to remove
 */
function removeFromStorage(key) {
  localStorage.removeItem(key);
}


/**
 * Debounce — delays a function call until the user
 * stops performing an action (like typing).
 * Used for the medicine search input.
 *
 * @param {Function} fn      - The function to debounce
 * @param {number}   delay   - Milliseconds to wait (e.g. 300)
 * @returns {Function}       - Debounced version of fn
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}


/**
 * Generates a unique order number for medicine orders.
 * Format: MS-20251225-12345
 *
 * @returns {string} - Order number
 */
function generateOrderNumber() {
  const d    = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `MS-${date}-${rand}`;
}
