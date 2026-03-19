// ================================================================
//  auth.js — Joe Hardware & Motorparts
//  Handles login, logout, session, and auth guard
//  Used by: login.html (login logic)
//           shell.js (Auth.getUser, Auth.logout)
//           every page (Auth.require via shell.js)
// ================================================================

const Auth = {

  // ── Session ────────────────────────────────────────────────
  SESSION_KEY: 'jh_user',

  getUser() {
    const raw = localStorage.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setUser(user) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  },

  clearUser() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  // ── Guard — call on every protected page ───────────────────
  require() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  },

  // ── Login — called from login.js ───────────────────────────
  async login(username, password) {
    const { data, error } = await db
      .from('employee')
      .select('employee_id, full_name, username, password, role(role_name)')
      .eq('username', username)
      .maybeSingle();

    if (error || !data)          return { ok: false, message: 'Invalid username or password.' };
    if (data.password !== password) return { ok: false, message: 'Invalid username or password.' };

    this.setUser({
      employee_id: data.employee_id,
      full_name:   data.full_name,
      username:    data.username,
      role:        data.role?.role_name || 'Staff',
    });

    return { ok: true };
  },

  // ── Logout — called from shell.js ─────────────────────────
  logout() {
    this.clearUser();
    window.location.href = 'login.html';
  },

};

// Auto-guard: any page that loads auth.js (except login.html)
// will redirect to login if no session exists
if (!window.location.pathname.endsWith('login.html')) {
  if (!Auth.require()) {
    // Redirecting — stop execution
    throw new Error('Not authenticated');
  }
}