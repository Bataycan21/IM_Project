// ================================================================
//  employees.js — StockPilot Employees
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const EMPLOYEES = [
    { id: 1, name: 'Maria Santos',   role: 'Manager',         username: 'msantos'  },
    { id: 2, name: 'John Rivera',    role: 'Sales Rep',       username: 'jrivera'  },
    { id: 3, name: 'Ana Cruz',       role: 'Sales Rep',       username: 'acruz'    },
    { id: 4, name: 'Carlos Reyes',   role: 'Warehouse Staff', username: 'creyes'   },
    { id: 5, name: 'Linda Garcia',   role: 'Warehouse Staff', username: 'lgarcia'  },
    { id: 6, name: 'Roberto Torres', role: 'Manager',         username: 'rtorres'  },
    { id: 7, name: 'Sofia Mendoza',  role: 'Sales Rep',       username: 'smendoza' },
  ];

  const ROLES = ['Manager', 'Sales Rep', 'Warehouse Staff'];

  let filtered = [...EMPLOYEES];
  let nextId   = EMPLOYEES.length + 1;

  // ── Helpers ───────────────────────────────────────────────────
  function roleBadge(role) {
    const map = {
      'Manager':         'badge-blue',
      'Sales Rep':       'badge-blue',
      'Warehouse Staff': 'badge-blue',
    };
    return `<span class="badge ${map[role] || 'badge-gray'}">${role}</span>`;
  }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">No employees found.</td></tr>`;
    return list.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${e.name}</td>
        <td>${roleBadge(e.role)}</td>
        <td class="td-mono">${e.username}</td>
      </tr>
    `).join('');
  }

  function renderTable() {
    document.getElementById('employees-tbody').innerHTML = tableRows(filtered);
    document.getElementById('employees-count').textContent = `${filtered.length} employee${filtered.length !== 1 ? 's' : ''}`;
  }

  // ── Toast ─────────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} toast-show`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('toast-show'), 2800);
  }

  function closeModal() {
    document.getElementById('modalSlot').innerHTML = '';
  }

  // ── Open Add Employee Modal ───────────────────────────────────
  function openModal() {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">👤 Add Employee</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" id="f-name" type="text" placeholder="e.g. Juan dela Cruz" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select class="form-input" id="f-role">
                ${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input class="form-input" id="f-username" type="text" placeholder="e.g. jdelacruz" required/>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-blue">Save Employee</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });

    document.getElementById('modal-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const name     = document.getElementById('f-name').value.trim();
      const role     = document.getElementById('f-role').value;
      const username = document.getElementById('f-username').value.trim();

      if (!name || !username) { showToast('Please fill in all fields.', 'error'); return; }

      EMPLOYEES.push({ id: nextId++, name, role, username });
      filtered = [...EMPLOYEES];
      applyFilters();
      closeModal();
      showToast(`"${name}" added!`);
    });
  }

  // ── Filters ───────────────────────────────────────────────────
  function applyFilters() {
    const q    = (document.getElementById('search-employees')?.value || '').toLowerCase();
    const role = document.getElementById('filter-role')?.value || '';

    filtered = EMPLOYEES.filter(e => {
      const matchQ = !q    || e.name.toLowerCase().includes(q) || e.username.toLowerCase().includes(q);
      const matchR = !role || e.role === role;
      return matchQ && matchR;
    });
    renderTable();
  }

  // ── Render ────────────────────────────────────────────────────
  document.getElementById('app').innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-title">📦 StockPilot</div>
          <div class="logo-sub">Inventory Management</div>
        </div>
        <nav class="sidebar-nav">
          <a href="dashboard.html"  class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
          <a href="products.html"   class="nav-item"><span class="nav-icon">📦</span> Products</a>
          <a href="sales.html"      class="nav-item"><span class="nav-icon">🧾</span> Sales</a>
          <a href="supplies.html"   class="nav-item"><span class="nav-icon">🚚</span> Supplies</a>
          <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
          <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
          <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
          <a href="employees.html"  class="nav-item active"><span class="nav-icon">👤</span> Employees</a>
          <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
        </nav>
        <div class="sidebar-footer">👤 Maria Santos</div>
      </aside>

      <main class="main">
        <div id="pageContent">
          <div class="page-header">
            <h1 class="page-title">Employees</h1>
            <button class="btn btn-blue" id="btn-add">+ Add Employee</button>
          </div>
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-employees" type="text" placeholder="🔍 Search name or username..."/>
            <select class="filter-select" id="filter-role">
              <option value="">All Roles</option>
              ${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
            <span id="employees-count" style="margin-left:auto;font-size:13px;color:#aaa;font-weight:600;">${EMPLOYEES.length} employees</span>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Role</th><th>Username</th></tr>
                </thead>
                <tbody id="employees-tbody">${tableRows(EMPLOYEES)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>
  `;

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate between modules.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-employees').addEventListener('input', applyFilters);
  document.getElementById('filter-role').addEventListener('change', applyFilters);

})();