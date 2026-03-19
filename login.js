// ================================================================
//  login.js — Joe Hardware & Motorparts
//  Uses Auth from auth.js
// ================================================================

(async function () {

  // Already logged in → go to dashboard
  if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('app').innerHTML = `
    <div class="login-bg">
      <div class="login-card">

        <!-- Logo -->
        <div class="login-logo">
          <div class="login-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div>
            <div class="login-brand-name">Joe Hardware</div>
            <div class="login-brand-sub">&amp; Motorparts</div>
          </div>
        </div>

        <div class="login-title">Sign In</div>
        <div class="login-sub">Enter your credentials to continue</div>

        <form id="login-form" autocomplete="off">

          <div class="form-group">
            <label class="form-label">Username</label>
            <div class="login-input-wrap">
              <svg class="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input class="form-input login-input" id="f-username" type="text"
                placeholder="Enter your username" autocomplete="username" required/>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="login-input-wrap">
              <svg class="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input class="form-input login-input" id="f-password" type="password"
                placeholder="Enter your password" autocomplete="current-password" required/>
              <button type="button" class="login-toggle-pw" id="toggle-pw">
                <svg id="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <div id="login-error" class="login-error" style="display:none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span id="login-error-msg">Invalid username or password.</span>
          </div>

          <button type="submit" class="login-btn" id="login-btn">Log In</button>

        </form>

        <div class="login-footer">
          Joe Hardware &amp; Motorparts &nbsp;&middot;&nbsp; Inventory System
        </div>

      </div>
    </div>`;

  // Show/hide password
  document.getElementById('toggle-pw').addEventListener('click', () => {
    const input = document.getElementById('f-password');
    const icon  = document.getElementById('eye-icon');
    if (input.type === 'password') {
      input.type = 'text';
      icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
    } else {
      input.type = 'password';
      icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  });

  // Submit
  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('f-username').value.trim();
    const password = document.getElementById('f-password').value;
    const btn      = document.getElementById('login-btn');
    const errEl    = document.getElementById('login-error');

    // Loading state
    btn.textContent   = 'Signing in...';
    btn.disabled      = true;
    btn.style.opacity = '0.7';
    errEl.style.display = 'none';

    try {
      const { data, error } = await db
        .from('employee')
        .select('employee_id, full_name, username, password, role(role_name)')
        .eq('username', username)
        .maybeSingle();

      if (error || !data || data.password !== password) {
        showError('Invalid username or password.');
        return;
      }

      // Save session via Auth
      Auth.setUser({
        employee_id: data.employee_id,
        full_name:   data.full_name,
        username:    data.username,
        role:        data.role?.role_name || 'Staff',
      });

      // Success
      btn.textContent       = '✓ Success!';
      btn.style.background  = '#4caf50';
      btn.style.opacity     = '1';
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);

    } catch (err) {
      showError('Something went wrong. Please try again.');
    }
  });

  function showError(msg) {
    const btn   = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    document.getElementById('login-error-msg').textContent = msg;
    errEl.style.display = 'flex';
    btn.textContent      = 'Log In';
    btn.disabled         = false;
    btn.style.opacity    = '1';
    btn.style.background = '';
    const card = document.querySelector('.login-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'shake 0.3s ease';
  }

})();