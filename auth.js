// ================================================================
//  auth.js — Joe Hardware & Motorparts
//  Handles login, logout, session, and auth guard
// ================================================================

const Auth = {

  SESSION_KEY: 'jh_user',

  // Get current user from localStorage
  getUser() {
    const raw = localStorage.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  // Save user to localStorage
  setUser(user) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  },

  // Clear session
  clearUser() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  // Auth guard — redirects to login if no session
  require() {
    const user = this.getUser();
    if (!user) {
      window.location.replace('login.html');
      return null;
    }
    return user;
  },

  // Login — checks credentials against employee table
  async login(username, password) {
    const { data, error } = await db
      .from('employee')
      .select('employee_id, full_name, username, password, role(role_name)')
      .eq('username', username)
      .maybeSingle();

    if (error || !data)             return { ok: false, message: 'Invalid username or password.' };
    if (data.password !== password) return { ok: false, message: 'Invalid username or password.' };

    this.setUser({
      employee_id: data.employee_id,
      full_name:   data.full_name,
      username:    data.username,
      role:        data.role?.role_name || 'Staff',
    });

    return { ok: true };
  },

  // Logout — clears session and redirects to login
  logout() {
    this.clearUser();
    window.location.replace('login.html');
  },

};

// ── Auto guard ────────────────────────────────────────────────
// Runs on every page EXCEPT login.html
// Uses window.location.replace so it redirects cleanly with no error
(function () {
  const isLoginPage = window.location.pathname.endsWith('login.html') ||
                      window.location.pathname.endsWith('index.html') ||
                      window.location.pathname === '/' ||
                      window.location.pathname === '';
  if (!isLoginPage && !Auth.getUser()) {
    window.location.replace('login.html');
  }
})();