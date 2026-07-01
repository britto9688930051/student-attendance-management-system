// Small fetch wrapper shared by all pages.
// Change this if your backend runs on a different host/port.
const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

// Redirects to login if there's no session, or to the wrong dashboard for the role.
function requireRole(role) {
  const user = getUser();
  const token = getToken();
  if (!token || !user) {
    window.location.href = "index.html";
    return null;
  }
  if (user.role !== role) {
    window.location.href = user.role === "staff" ? "dashboard.html" : "student.html";
    return null;
  }
  return user;
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}
