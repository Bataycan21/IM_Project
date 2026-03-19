// ================================================================
//  shell.js — Joe Hardware & Motorparts
//  Shared nav items + renderShell(activeId) pattern
// ================================================================

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: 'dashboard.html',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>`
  },
  {
    id: 'products',
    label: 'Products',
    href: 'products.html',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`
  },
  {
    id: 'returns',
    label: 'Returns',
    href: 'returns.html',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
    </svg>`
  },
  {
    id: 'supply-suppliers',
    label: 'Supply & Suppliers',
    href: 'supply-suppliers.html',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>`
  },
  {
    id: 'stockouts',
    label: 'Stock Out',
    href: 'stockouts.html',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`
  },
  {
    id: 'reports',
    label: 'Reports',
    href: 'reports.html',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>`
  },
  {
    id: 'settings',
    label: 'Settings',
    href: 'settings.html',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
    </svg>`
  }
];

function renderShell(activeId) {
  // Read logged-in user from auth.js session
  const currentUser = Auth.getUser();

  // Cashier cannot access Stock Out, Reports, Settings
  const MANAGER_ONLY = ['stockouts', 'reports', 'settings'];
  const isManager = currentUser.role === 'Manager';

  // Block direct URL access for Cashiers
  if (!isManager && MANAGER_ONLY.includes(activeId)) {
    document.getElementById('app').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:var(--bg);flex-direction:column;gap:16px;">
        <div style="font-size:40px;">🔒</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:1px;">Access Restricted</div>
        <div style="font-size:13px;color:var(--text-muted);">You don't have permission to view this page.</div>
        <a href="dashboard.html" style="margin-top:8px;padding:10px 24px;background:var(--amber);color:#000;border-radius:7px;font-family:'Barlow',sans-serif;font-size:13px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Go to Dashboard</a>
      </div>`;
    return;
  }

  const navHTML = NAV_ITEMS
    .filter(item => isManager || !MANAGER_ONLY.includes(item.id))
    .map(item => `
      <a href="${item.href}" class="nav-item ${item.id === activeId ? 'active' : ''}">
        ${item.icon}
        <span class="nav-label">${item.label}</span>
      </a>
    `).join('');

  document.getElementById('app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">

        <a href="dashboard.html" class="sidebar-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div class="brand-text">
            <div class="brand-name">Joex Hardware</div>
            <div class="brand-sub">&amp; Motorparts</div>
          </div>
        </a>

        <nav class="sidebar-nav">${navHTML}</nav>

        <div class="sidebar-collapse">
          <button id="collapseBtn" title="Collapse sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>

      </aside>

      <div class="main-area">
        <header class="top-header">
          <div class="header-title" id="header-title"></div>
          <div class="header-right">
            <div class="user-profile" id="userProfileBtn">
              <div class="user-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="user-info">
                <div class="user-name">${currentUser.full_name}</div>
                <div class="user-role">${currentUser.role}</div>
              </div>
              <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <div id="userDropdown" class="user-dropdown" style="display:none;">
                <div class="dropdown-header">
                  <div class="dropdown-name">${currentUser.full_name}</div>
                  <div class="dropdown-role">${currentUser.role}</div>
                </div>
                <div class="dropdown-body">
                  <a href="settings.html" class="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
                    </svg>
                    Settings
                  </a>
                  <div class="dropdown-divider"></div>
                  <a href="#" id="btn-logout" class="dropdown-item dropdown-item-danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main class="page-content" id="pageContent"></main>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div id="logout-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;align-items:center;justify-content:center;backdrop-filter:blur(3px);">
      <div style="background:var(--card);border:1px solid var(--border);border-top:3px solid var(--red);border-radius:10px;padding:28px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:38px;height:38px;background:var(--red-dim);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.8px;">Confirm Logout</div>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:24px;line-height:1.6;">
          Are you sure you want to log out, <strong style="color:#fff;">${currentUser.full_name}</strong>?
        </p>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button class="btn-ghost" id="cancel-logout">Cancel</button>
          <button class="btn" id="confirm-logout" style="background:var(--red);color:#fff;">Log Out</button>
        </div>
      </div>
    </div>`;

  // Collapse toggle
  document.getElementById('collapseBtn').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
  });

  // Restore sidebar collapsed state
  if (localStorage.getItem('sidebar-collapsed') === 'true') {
    document.getElementById('sidebar').classList.add('collapsed');
  }

  // User dropdown toggle
  document.addEventListener('click', function (e) {
    const btn      = document.getElementById('userProfileBtn');
    const dropdown = document.getElementById('userDropdown');
    if (!btn || !dropdown) return;
    if (btn.contains(e.target)) {
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    } else {
      dropdown.style.display = 'none';
    }
  });

  // Logout button → show modal
  document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('userDropdown').style.display = 'none';
    const modal = document.getElementById('logout-modal');
    modal.style.display = 'flex';
  });

  // Cancel logout
  document.getElementById('cancel-logout').addEventListener('click', () => {
    document.getElementById('logout-modal').style.display = 'none';
  });

  // Confirm logout → delegate to Auth
  document.getElementById('confirm-logout').addEventListener('click', () => {
    const btn = document.getElementById('confirm-logout');
    btn.textContent = 'Logging out...';
    btn.disabled = true;
    setTimeout(() => Auth.logout(), 500);
  });

  // Close modal on backdrop click
  document.getElementById('logout-modal').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });
}