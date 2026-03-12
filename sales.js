// ================================================================
//  sales.js — StockPilot Sales
//  Renders: sidebar + sales table + new sale modal + events
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const SALES = [
    { id: 1, date: '2026-03-11', customer: 'Tech Solutions Inc.', employee: 'Maria Santos', total: 1250.00 },
    { id: 2, date: '2026-03-11', customer: 'ABC Retail Store',    employee: 'John Rivera',  total: 890.50  },
    { id: 3, date: '2026-03-10', customer: 'Global Systems',      employee: 'Maria Santos', total: 2100.00 },
    { id: 4, date: '2026-03-10', customer: 'Office Supplies Co.', employee: 'Ana Cruz',     total: 450.75  },
    { id: 5, date: '2026-03-09', customer: 'Digital Ventures',    employee: 'John Rivera',  total: 3200.00 },
    { id: 6, date: '2026-03-09', customer: 'Prime Electronics',   employee: 'Maria Santos', total: 1680.25 },
    { id: 7, date: '2026-03-08', customer: 'Smart Solutions',     employee: 'Ana Cruz',     total: 920.00  },
  ];

  const EMPLOYEES = ['Maria Santos', 'John Rivera', 'Ana Cruz', 'Juan dela Cruz'];

  let filtered = [...SALES];
  let nextId   = SALES.length + 1;

  // ── Helpers ───────────────────────────────────────────────────
  function peso(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function tableRows(list) {
    if (!list.length) return `
      <tr>
        <td colspan="5" class="td-muted" style="text-align:center;padding:32px;">
          No sales found.
        </td>
      </tr>`;
    return list.map((s, i) => `
      <tr data-id="${s.id}">
        <td>${i + 1}</td>
        <td>${s.date}</td>
        <td class="td-bold">${s.customer}</td>
        <td>${s.employee}</td>
        <td style="color:#4a9e74;font-weight:700;">${peso(s.total)}</td>
      </tr>
    `).join('');
  }

  function renderTable() {
    document.getElementById('sales-tbody').innerHTML = tableRows(filtered);
    document.getElementById('sales-count').textContent =
      `${filtered.length} sale${filtered.length !== 1 ? 's' : ''}`;
  }

  // ── Toast ─────────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} toast-show`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('toast-show'), 2800);
  }

  // ── Close Modal ───────────────────────────────────────────────
  function closeModal() {
    document.getElementById('modalSlot').innerHTML = '';
  }

  // ── Open New Sale Modal ───────────────────────────────────────
  function openNewSaleModal() {
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">🧾 New Sale</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="f-date" type="date" value="${today}" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Customer Name</label>
              <input class="form-input" id="f-customer" type="text" placeholder="e.g. Acme Corp" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Employee</label>
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
              <button type="submit" class="btn btn-green">Save Sale</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    document.getElementById('modal-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const date     = document.getElementById('f-date').value;
      const customer = document.getElementById('f-customer').value.trim();
      const employee = document.getElementById('f-employee').value;
      const total    = parseFloat(document.getElementById('f-total').value);

      if (!date || !customer || isNaN(total)) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      SALES.unshift({ id: nextId++, date, customer, employee, total });
      filtered = [...SALES];
      applyFilters();
      closeModal();
      showToast(`Sale for "${customer}" saved!`);
    });
  }

  // ── Filter & Search ───────────────────────────────────────────
  function applyFilters() {
    const q   = (document.getElementById('search-sales')?.value || '').toLowerCase();
    const emp = document.getElementById('filter-employee')?.value || '';

    filtered = SALES.filter(s => {
      const matchQ   = !q   || s.customer.toLowerCase().includes(q) || s.date.includes(q);
      const matchEmp = !emp || s.employee === emp;
      return matchQ && matchEmp;
    });

    renderTable();
  }

  // ── Render App ────────────────────────────────────────────────
  document.getElementById('app').innerHTML = `
    <div class="app">

      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-title">📦 StockPilot</div>
          <div class="logo-sub">Inventory Management</div>
        </div>
        <nav class="sidebar-nav">
          <a href="dashboard.html"  class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
          <a href="products.html"   class="nav-item"><span class="nav-icon">📦</span> Products</a>
          <a href="sales.html"      class="nav-item active"><span class="nav-icon">🧾</span> Sales</a>
          <a href="supplies.html"   class="nav-item"><span class="nav-icon">🚚</span> Supplies</a>
          <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
          <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
          <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
          <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
          <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
        </nav>
        <div class="sidebar-footer">👤 Maria Santos</div>
      </aside>

      <!-- MAIN -->
      <main class="main">
        <div id="pageContent">

          <!-- Page Header -->
          <div class="page-header">
            <h1 class="page-title">Sales</h1>
            <button class="btn btn-green" id="btn-new-sale">+ New Sale</button>
          </div>

          <!-- Toolbar -->
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-sales" type="text" placeholder="🔍 Search customer or date..."/>
            <select class="filter-select" id="filter-employee">
              <option value="">All Employees</option>
              ${EMPLOYEES.map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
            <span id="sales-count" style="margin-left:auto;font-size:13px;color:#aaa;font-weight:600;">
              ${SALES.length} sales
            </span>
          </div>

          <!-- Table -->
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Employee</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody id="sales-tbody">
                  ${tableRows(SALES)}
                </tbody>
              </table>
            </div>
          </div>

        </div><!-- end pageContent -->
      </main>

    </div><!-- end app -->

    <!-- Modal Slot -->
    <div id="modalSlot"></div>

    <!-- Toast -->
    <div id="toast" class="toast"></div>

    <!-- Help FAB -->
    <button class="fab-help" id="btn-help">?</button>
  `;

  // ── Events ────────────────────────────────────────────────────

  document.getElementById('btn-help').addEventListener('click', () => {
    showToast('💡 Use the sidebar to navigate between modules.');
  });

  document.getElementById('btn-new-sale').addEventListener('click', openNewSaleModal);
  document.getElementById('search-sales').addEventListener('input', applyFilters);
  document.getElementById('filter-employee').addEventListener('change', applyFilters);

})();