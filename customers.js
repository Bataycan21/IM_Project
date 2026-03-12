// ================================================================
//  customers.js — StockPilot Customers
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const CUSTOMERS = [
    { id: 1, name: 'Tech Solutions Inc.',  type: 'Corporate', contact: '+1 (555) 123-4567' },
    { id: 2, name: 'ABC Retail Store',     type: 'Retail',    contact: '+1 (555) 234-5678' },
    { id: 3, name: 'Global Systems',       type: 'Corporate', contact: '+1 (555) 345-6789' },
    { id: 4, name: 'Office Supplies Co.',  type: 'Retail',    contact: '+1 (555) 456-7890' },
    { id: 5, name: 'Digital Ventures',     type: 'Corporate', contact: '+1 (555) 567-8901' },
    { id: 6, name: 'Prime Electronics',    type: 'Retail',    contact: '+1 (555) 678-9012' },
    { id: 7, name: 'Smart Solutions',      type: 'Corporate', contact: '+1 (555) 789-0123' },
    { id: 8, name: 'Central Warehouse',    type: 'Retail',    contact: '+1 (555) 890-1234' },
  ];

  let filtered = [...CUSTOMERS];
  let nextId   = CUSTOMERS.length + 1;

  // ── Helpers ───────────────────────────────────────────────────
  function typeBadge(type) {
    return type === 'Corporate'
      ? `<span class="badge badge-blue">Corporate</span>`
      : `<span class="badge badge-green">Retail</span>`;
  }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">No customers found.</td></tr>`;
    return list.map((c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${c.name}</td>
        <td>${typeBadge(c.type)}</td>
        <td>${c.contact}</td>
      </tr>
    `).join('');
  }

  function renderTable() {
    document.getElementById('customers-tbody').innerHTML = tableRows(filtered);
    document.getElementById('customers-count').textContent = `${filtered.length} customer${filtered.length !== 1 ? 's' : ''}`;
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

  // ── Open Add Customer Modal ───────────────────────────────────
  function openModal() {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">👥 Add Customer</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Customer Name</label>
              <input class="form-input" id="f-name" type="text" placeholder="e.g. Acme Corp" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-input" id="f-type">
                <option value="Corporate">Corporate</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input class="form-input" id="f-contact" type="text" placeholder="e.g. +1 (555) 000-0000" required/>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-blue">Save Customer</button>
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
      const name    = document.getElementById('f-name').value.trim();
      const type    = document.getElementById('f-type').value;
      const contact = document.getElementById('f-contact').value.trim();

      if (!name || !contact) { showToast('Please fill in all fields.', 'error'); return; }

      CUSTOMERS.push({ id: nextId++, name, type, contact });
      filtered = [...CUSTOMERS];
      applyFilters();
      closeModal();
      showToast(`"${name}" added!`);
    });
  }

  // ── Filters ───────────────────────────────────────────────────
  function applyFilters() {
    const q    = (document.getElementById('search-customers')?.value || '').toLowerCase();
    const type = document.getElementById('filter-type')?.value || '';

    filtered = CUSTOMERS.filter(c => {
      const matchQ = !q    || c.name.toLowerCase().includes(q) || c.contact.includes(q);
      const matchT = !type || c.type === type;
      return matchQ && matchT;
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
          <a href="customers.html"  class="nav-item active"><span class="nav-icon">👥</span> Customers</a>
          <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
          <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
        </nav>
        <div class="sidebar-footer">👤 Maria Santos</div>
      </aside>

      <main class="main">
        <div id="pageContent">
          <div class="page-header">
            <h1 class="page-title">Customers</h1>
            <button class="btn btn-blue" id="btn-add">+ Add Customer</button>
          </div>
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-customers" type="text" placeholder="🔍 Search name or contact..."/>
            <select class="filter-select" id="filter-type">
              <option value="">All Types</option>
              <option value="Corporate">Corporate</option>
              <option value="Retail">Retail</option>
            </select>
            <span id="customers-count" style="margin-left:auto;font-size:13px;color:#aaa;font-weight:600;">${CUSTOMERS.length} customers</span>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Type</th><th>Contact</th></tr>
                </thead>
                <tbody id="customers-tbody">${tableRows(CUSTOMERS)}</tbody>
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
  document.getElementById('search-customers').addEventListener('input', applyFilters);
  document.getElementById('filter-type').addEventListener('change', applyFilters);

})();