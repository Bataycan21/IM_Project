// ================================================================
//  stockouts.js — StockPilot Stock-Outs
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const STOCKOUTS = [
    { id: 1, date: '2026-03-11', product: 'USB Cable 2m',        qty: 15, employee: 'Maria Santos', desc: 'Insufficient supply for bulk order'  },
    { id: 2, date: '2026-03-10', product: 'Keyboard Mechanical', qty: 8,  employee: 'John Rivera',  desc: 'High demand exceeded forecast'        },
    { id: 3, date: '2026-03-09', product: 'Wireless Mouse',      qty: 12, employee: 'Ana Cruz',     desc: 'Delayed shipment from supplier'       },
    { id: 4, date: '2026-03-08', product: 'USB Hub 4-Port',      qty: 20, employee: 'Maria Santos', desc: 'Unexpected corporate order'           },
    { id: 5, date: '2026-03-07', product: 'HDMI Cable 1.5m',     qty: 10, employee: 'John Rivera',  desc: 'Seasonal demand spike'                },
  ];

  const EMPLOYEES = ['Maria Santos', 'John Rivera', 'Ana Cruz', 'Juan dela Cruz'];

  let filtered = [...STOCKOUTS];
  let nextId   = STOCKOUTS.length + 1;

  // ── Helpers ───────────────────────────────────────────────────
  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="6" class="td-muted" style="text-align:center;padding:32px;">No stock-outs found.</td></tr>`;
    return list.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.date}</td>
        <td class="td-bold">${s.product}</td>
        <td style="color:#b84040;font-weight:700;">${s.qty}</td>
        <td>${s.employee}</td>
        <td class="td-muted">${s.desc}</td>
      </tr>
    `).join('');
  }

  function renderTable() {
    document.getElementById('stockouts-tbody').innerHTML = tableRows(filtered);
    document.getElementById('stockouts-count').textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;
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

  // ── Open Record Stock-Out Modal ───────────────────────────────
  function openModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">⚠️ Record Stock-Out</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="f-date" type="date" value="${today}" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Product Name</label>
              <input class="form-input" id="f-product" type="text" placeholder="e.g. USB Cable 2m" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input class="form-input" id="f-qty" type="number" min="1" placeholder="0" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Employee</label>
              <select class="form-input" id="f-employee">
                ${EMPLOYEES.map(e => `<option value="${e}">${e}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input class="form-input" id="f-desc" type="text" placeholder="e.g. Expired stock disposal" required/>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-red">Record Stock-Out</button>
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
      const date     = document.getElementById('f-date').value;
      const product  = document.getElementById('f-product').value.trim();
      const qty      = parseInt(document.getElementById('f-qty').value);
      const employee = document.getElementById('f-employee').value;
      const desc     = document.getElementById('f-desc').value.trim();

      if (!date || !product || isNaN(qty) || !desc) { showToast('Please fill in all fields.', 'error'); return; }

      STOCKOUTS.unshift({ id: nextId++, date, product, qty, employee, desc });
      filtered = [...STOCKOUTS];
      applyFilters();
      closeModal();
      showToast(`Stock-out for "${product}" recorded!`);
    });
  }

  // ── Filters ───────────────────────────────────────────────────
  function applyFilters() {
    const q   = (document.getElementById('search-stockouts')?.value || '').toLowerCase();
    const emp = document.getElementById('filter-employee')?.value || '';

    filtered = STOCKOUTS.filter(s => {
      const matchQ   = !q   || s.product.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);
      const matchEmp = !emp || s.employee === emp;
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
          <a href="supplies.html"   class="nav-item"><span class="nav-icon">🚚</span> Supplies</a>
          <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
          <a href="stockouts.html"  class="nav-item active"><span class="nav-icon">⚠️</span> Stock-Outs</a>
          <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
          <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
          <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
        </nav>
        <div class="sidebar-footer">👤 Maria Santos</div>
      </aside>

      <main class="main">
        <div id="pageContent">
          <div class="page-header">
            <h1 class="page-title">Stock-Outs</h1>
            <button class="btn btn-red" id="btn-record">+ Record Stock-Out</button>
          </div>
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-stockouts" type="text" placeholder="🔍 Search product or description..."/>
            <select class="filter-select" id="filter-employee">
              <option value="">All Employees</option>
              ${EMPLOYEES.map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
            <span id="stockouts-count" style="margin-left:auto;font-size:13px;color:#aaa;font-weight:600;">${STOCKOUTS.length} records</span>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Product</th><th>Qty</th><th>Employee</th><th>Description</th>
                  </tr>
                </thead>
                <tbody id="stockouts-tbody">${tableRows(STOCKOUTS)}</tbody>
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
  document.getElementById('search-stockouts').addEventListener('input', applyFilters);
  document.getElementById('filter-employee').addEventListener('change', applyFilters);

})();