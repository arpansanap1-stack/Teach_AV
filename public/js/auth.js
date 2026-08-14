// Shared auth helpers -- used by login.html, teacher.html, and admin.html

const AUTH_KEY = "fc_auth";

function getAuth() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY));
    } catch (error) {
        return null;
    }
}

function setAuth(data) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function clearAuth() {
    localStorage.removeItem(AUTH_KEY);
}

// Redirects to login if not authenticated as the given role; returns the auth object otherwise
function requireRole(role) {
    const auth = getAuth();
    if (!auth || auth.role !== role) {
        window.location.href = "login.html";
        return null;
    }
    return auth;
}

function authHeader() {
    const auth = getAuth();
    return auth ? { Authorization: `Bearer ${auth.token}` } : {};
}

function logout() {
    clearAuth();
    window.location.href = "login.html";
}
