// ================================================================
//  supplies.js — StockPilot Supplies
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const SUPPLIES = [
    { id: 1, date: '2026-03-11', supplier: 'Tech Distributors Ltd.',    processedBy: 'Maria Santos', total: 12500.00 },
    { id: 2, date: '2026-03-10', supplier: 'Global Electronics Supply', processedBy: 'John Rivera',  total: 8900.00  },
    { id: 3, date: '2026-03-09', supplier: 'Premium Parts Inc.',        processedBy: 'Ana Cruz',     total: 15200.00 },
    { id: 4, date: '2026-03-08', supplier: 'Tech Distributors Ltd.',    processedBy: 'Maria Santos', total: 6750.00  },
    { id: 5, date: '2026-03-07', supplier: 'Component Wholesale',       processedBy: 'John Rivera',  total: 9400.00  },
    { id: 6, date: '2026-03-06', supplier: 'Global Electronics Supply', processedBy: 'Ana Cruz',     total: 11800.00 },
  ];

  const EMPLOYEES  = ['Maria Santos', 'John Rivera', 'Ana Cruz', 'Juan dela Cruz'];
  const SUPPLIERS  = [...new Set(SUPPLIES.map(s => s.supplier))];

  let filtered = [...SUPPLIES];
  let nextId   = SUPPLIES.length + 1;

  // ── Helpers ───────────────────────────────────────────────────
  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
  }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">No supplies found.</td></tr>`;
    return list.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.date}</td>
        <td class="td-bold">${s.supplier}</td>
        <td>${s.processedBy}</td>
        <td style="color:#7c5cbf;font-weight:700;">${fmt(s.total)}</td>
      </tr>
    `).join('');
  }

  function renderTable() {
    document.getElementById('supplies-tbody').innerHTML = tableRows(filtered);
    document.getElementById('supplies-count').textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;
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

  // ── Open Record Supply Modal ──────────────────────────────────
  function openModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">🚚 Record Supply</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="f-date" type="date" value="${today}" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Supplier</label>
              <input class="form-input" id="f-supplier" type="text" placeholder="e.g. Tech Distributors Ltd." required/>
            </div>
            <div class="form-group">
              <label class="form-label">Processed By</label>
              <select class="form-input" id="f-employee">
                ${EMPLOYEES.map(e => `<option value="${e}">${e}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Total Amount (₱)</label>
              <input class="form-input" id="f-total" type="number" min="0" step="0.01" placeholder="0.00" required/>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-purple">Save Supply</button>
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
      const date       = document.getElementById('f-date').value;
      const supplier   = document.getElementById('f-supplier').value.trim();
      const processedBy= document.getElementById('f-employee').value;
      const total      = parseFloat(document.getElementById('f-total').value);

      if (!date || !supplier || isNaN(total)) { showToast('Please fill in all fields.', 'error'); return; }

      SUPPLIES.unshift({ id: nextId++, date, supplier, processedBy, total });
      filtered = [...SUPPLIES];
      applyFilters();
      closeModal();
      showToast(`Supply from "${supplier}" recorded!`);
    });
  }

  // ── Filters ───────────────────────────────────────────────────
  function applyFilters() {
    const q   = (document.getElementById('search-supplies')?.value || '').toLowerCase();
    const emp = document.getElementById('filter-employee')?.value || '';

    filtered = SUPPLIES.filter(s => {
      const matchQ   = !q   || s.supplier.toLowerCase().includes(q) || s.date.includes(q);
      const matchEmp = !emp || s.processedBy === emp;
      return matchQ && matchEmp;
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
          <a href="supplies.html"   class="nav-item active"><span class="nav-icon">🚚</span> Supplies</a>
          <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
          <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
          <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
          <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
          <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
        </nav>
        <div class="sidebar-footer">👤 Maria Santos</div>
      </aside>

      <main class="main">
        <div id="pageContent">
          <div class="page-header">
            <h1 class="page-title">Supplies</h1>
            <button class="btn btn-purple" id="btn-record">+ Record Supply</button>
          </div>
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-supplies" type="text" placeholder="🔍 Search supplier or date..."/>
            <select class="filter-select" id="filter-employee">
              <option value="">All Employees</option>
              ${EMPLOYEES.map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
            <span id="supplies-count" style="margin-left:auto;font-size:13px;color:#aaa;font-weight:600;">${SUPPLIES.length} records</span>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Supplier</th><th>Processed By</th><th>Total</th>
                  </tr>
                </thead>
                <tbody id="supplies-tbody">${tableRows(SUPPLIES)}</tbody>
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
  document.getElementById('btn-record').addEventListener('click', openModal);
  document.getElementById('search-supplies').addEventListener('input', applyFilters);
  document.getElementById('filter-employee').addEventListener('change', applyFilters);

})();