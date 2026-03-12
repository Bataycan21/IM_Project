// ================================================================
//  employees.js — StockPilot Employees (Supabase connected)
// ================================================================

(async function () {

  const SIDEBAR = `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-title">⚙️ STOCK<span class="logo-accent">PILOT</span></div>
        <div class="logo-sub">Hardware &amp; Motor Parts</div>
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
    </aside>`;

  let EMPLOYEES = [], ROLES = [], filtered = [];

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">No employees found.</td></tr>`;
    return list.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="td-bold">${e.full_name}</td>
        <td><span class="badge badge-blue">${e.role?.role_name || '—'}</span></td>
        <td class="td-mono">${e.username}</td>
      </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('employees-tbody').innerHTML = tableRows(filtered);
    document.getElementById('employees-count').textContent = `${filtered.length} employee${filtered.length !== 1 ? 's' : ''}`;
  }

  async function loadEmployees() {
    const { data } = await db.from('employee')
      .select('*, role(role_name)')
      .order('full_name');
    EMPLOYEES = data || []; filtered = [...EMPLOYEES]; renderTable();
  }

  async function loadLookups() {
    const { data } = await db.from('role').select('*').order('role_name');
    ROLES = data || [];
  }

  function applyFilters() {
    const q    = (document.getElementById('search-employees')?.value || '').toLowerCase();
    const role = document.getElementById('filter-role')?.value || '';
    filtered = EMPLOYEES.filter(e => {
      const mQ = !q    || e.full_name.toLowerCase().includes(q) || e.username.toLowerCase().includes(q);
      const mR = !role || String(e.role_id) === role;
      return mQ && mR;
    });
    renderTable();
  }

  function openModal() {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">👤 Add Employee</div><button class="modal-close" id="modal-close">✕</button></div>
          <form id="modal-form">
            <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="f-name" type="text" placeholder="e.g. Juan dela Cruz" required/></div>
            <div class="form-group"><label class="form-label">Role</label>
              <select class="form-input" id="f-role">${ROLES.map(r => `<option value="${r.role_id}">${r.role_name}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Username</label><input class="form-input" id="f-username" type="text" placeholder="e.g. jdelacruz" required/></div>
            <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="f-password" type="password" placeholder="••••••••" required/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="modal-cancel">Cancel</button><button type="submit" class="btn btn-red">Save Employee</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('f-name').value.trim();
      const uname = document.getElementById('f-username').value.trim();
      if (!name || !uname) { showToast('Name and username are required.', 'error'); return; }
      const { error } = await db.from('employee').insert({
        full_name: name,
        role_id:   parseInt(document.getElementById('f-role').value),
        username:  uname,
        password:  document.getElementById('f-password').value,
      });
      if (error) { showToast(error.message || 'Error saving employee.', 'error'); return; }
      closeModal(); await loadEmployees(); showToast(`"${name}" added!`);
    });
  }

  document.getElementById('app').innerHTML = `
    <div class="app">${SIDEBAR}
      <main class="main"><div id="pageContent">
        <div class="page-header"><h1 class="page-title">Employees</h1><button class="btn btn-red" id="btn-add">+ Add Employee</button></div>
        <div class="toolbar" style="margin-bottom:16px;">
          <input class="search-input" id="search-employees" type="text" placeholder="🔍 Search name or username..."/>
          <select class="filter-select" id="filter-role"><option value="">All Roles</option></select>
          <span id="employees-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;">Loading...</span>
        </div>
        <div class="card" style="padding:0;overflow:hidden;"><div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Username</th></tr></thead>
          <tbody id="employees-tbody"><tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
        </table></div></div>
      </div></main>
    </div>
    <div id="modalSlot"></div><div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>`;

  await loadLookups();
  document.getElementById('filter-role').innerHTML = `<option value="">All Roles</option>${ROLES.map(r => `<option value="${r.role_id}">${r.role_name}</option>`).join('')}`;
  await loadEmployees();

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-employees').addEventListener('input', applyFilters);
  document.getElementById('filter-role').addEventListener('change', applyFilters);

})();