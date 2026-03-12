// ================================================================
//  returns.js — StockPilot Returns
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const RETURNS = [
    { id: 1, date: '2026-03-11', product: 'Wireless Mouse',      qty: 2, reason: 'Defective',        status: 'pending'  },
    { id: 2, date: '2026-03-10', product: 'HDMI Cable 1.5m',     qty: 1, reason: 'Wrong item',       status: 'pending'  },
    { id: 3, date: '2026-03-09', product: 'Keyboard Mechanical', qty: 1, reason: 'Customer request', status: 'pending'  },
    { id: 4, date: '2026-03-08', product: 'Webcam HD',           qty: 3, reason: 'Defective',        status: 'pending'  },
    { id: 5, date: '2026-03-07', product: 'USB Cable 2m',        qty: 5, reason: 'Quality issue',    status: 'pending'  },
    { id: 6, date: '2026-03-06', product: 'Monitor 24"',         qty: 1, reason: 'Damaged',          status: 'resolved' },
  ];

  const REASONS = ['Defective', 'Wrong item', 'Customer request', 'Quality issue', 'Damaged', 'Other'];

  let filtered = [...RETURNS];
  let nextId   = RETURNS.length + 1;

  // ── Helpers ───────────────────────────────────────────────────
  function statusBadge(s) {
    return s === 'resolved'
      ? `<span class="badge badge-green">Resolved</span>`
      : `<span class="badge badge-yellow">Pending</span>`;
  }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="6" class="td-muted" style="text-align:center;padding:32px;">No returns found.</td></tr>`;
    return list.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.date}</td>
        <td class="td-bold">${r.product}</td>
        <td>${r.qty}</td>
        <td>${r.reason}</td>
        <td>${statusBadge(r.status)}</td>
      </tr>
    `).join('');
  }

  function renderTable() {
    document.getElementById('returns-tbody').innerHTML = tableRows(filtered);
    document.getElementById('returns-count').textContent = `${filtered.length} return${filtered.length !== 1 ? 's' : ''}`;
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

  // ── Open Log Return Modal ─────────────────────────────────────
  function openModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">↩️ Log Return</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="f-date" type="date" value="${today}" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Product Name</label>
              <input class="form-input" id="f-product" type="text" placeholder="e.g. Wireless Mouse" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Quantity Returned</label>
              <input class="form-input" id="f-qty" type="number" min="1" placeholder="1" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Reason</label>
              <select class="form-input" id="f-reason">
                ${REASONS.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-amber">Log Return</button>
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
      const date    = document.getElementById('f-date').value;
      const product = document.getElementById('f-product').value.trim();
      const qty     = parseInt(document.getElementById('f-qty').value);
      const reason  = document.getElementById('f-reason').value;

      if (!date || !product || isNaN(qty)) { showToast('Please fill in all fields.', 'error'); return; }

      RETURNS.unshift({ id: nextId++, date, product, qty, reason, status: 'pending' });
      filtered = [...RETURNS];
      applyFilters();
      closeModal();
      showToast(`Return for "${product}" logged!`);
    });
  }

  // ── Filters ───────────────────────────────────────────────────
  function applyFilters() {
    const q      = (document.getElementById('search-returns')?.value || '').toLowerCase();
    const status = document.getElementById('filter-status')?.value || '';

    filtered = RETURNS.filter(r => {
      const matchQ = !q || r.product.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
      const matchS = !status || r.status === status;
      return matchQ && matchS;
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
          <a href="returns.html"    class="nav-item active"><span class="nav-icon">↩️</span> Returns</a>
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
            <h1 class="page-title">Returns</h1>
            <button class="btn btn-amber" id="btn-log">+ Log Return</button>
          </div>
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-returns" type="text" placeholder="🔍 Search product or reason..."/>
            <select class="filter-select" id="filter-status">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
            <span id="returns-count" style="margin-left:auto;font-size:13px;color:#aaa;font-weight:600;">${RETURNS.length} returns</span>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Product</th><th>Qty</th><th>Reason</th><th>Status</th>
                  </tr>
                </thead>
                <tbody id="returns-tbody">${tableRows(RETURNS)}</tbody>
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
  document.getElementById('btn-log').addEventListener('click', openModal);
  document.getElementById('search-returns').addEventListener('input', applyFilters);
  document.getElementById('filter-status').addEventListener('change', applyFilters);

})();