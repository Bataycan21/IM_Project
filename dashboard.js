// ================================================================
//  dashboard.js — StockPilot Dashboard
//  Renders: sidebar + all dashboard content + events
// ================================================================

(function () {

  // ── Data ──────────────────────────────────────────────────────
  const now   = new Date();
  const today = now.toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const KPI = {
    totalProducts:  1247,
    todaysSales:    8450,
    pendingReturns: 23,
    lowStockItems:  18,
  };

  const LOW_STOCK = [
    { name: 'Wireless Mouse',      qty: 5,  level: 'critical' },
    { name: 'USB Cable 2m',        qty: 12, level: 'low'      },
    { name: 'Keyboard Mechanical', qty: 8,  level: 'critical' },
    { name: 'HDMI Cable',          qty: 15, level: 'low'      },
    { name: 'USB Hub 4-Port',      qty: 6,  level: 'critical' },
    { name: 'Mousepad XL',         qty: 18, level: 'low'      },
  ];

  const RECENT_SALES = [
    { customer: 'Tech Solutions Inc.', amount: 1250, status: 'completed' },
    { customer: 'ABC Retail Store',    amount: 890,  status: 'completed' },
    { customer: 'Global Systems',      amount: 2100, status: 'completed' },
    { customer: 'Office Supplies Co.', amount: 450,  status: 'completed' },
    { customer: 'BrightTech Corp',     amount: 3200, status: 'pending'   },
  ];

  // ── Helpers ───────────────────────────────────────────────────
  function peso(n) {
    return '₱' + Number(n).toLocaleString();
  }

  function lowStockRows(items) {
    if (!items.length) return `<div class="empty-state">No items found.</div>`;
    return items.map(i => `
      <div class="list-row">
        <div>
          <div class="list-row-name">${i.name}</div>
          <div class="list-row-sub">Qty: ${i.qty}</div>
        </div>
        <span class="badge ${i.level === 'critical' ? 'badge-red' : 'badge-yellow'}">
          ${i.level === 'critical' ? 'Critical' : 'Low Stock'}
        </span>
      </div>
    `).join('');
  }

  function salesRows(items) {
    if (!items.length) return `<div class="empty-state">No sales found.</div>`;
    return items.map(i => `
      <div class="list-row">
        <div>
          <div class="list-row-name">${i.customer}</div>
          <div class="list-row-sub list-row-amount">${peso(i.amount)}</div>
        </div>
        <span class="badge ${i.status === 'completed' ? 'badge-green' : 'badge-yellow'}">
          ${i.status === 'completed' ? 'Completed' : 'Pending'}
        </span>
      </div>
    `).join('');
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
          <a href="dashboard.html"  class="nav-item active"><span class="nav-icon">🏠</span> Dashboard</a>
          <a href="products.html"   class="nav-item"><span class="nav-icon">📦</span> Products</a>
          <a href="sales.html"      class="nav-item"><span class="nav-icon">🧾</span> Sales</a>
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
            <div>
              <div class="dashboard-date">${today}</div>
              <h1 class="page-title">Dashboard</h1>
            </div>
            <div style="display:flex;gap:10px;">
              <button class="btn btn-ghost" id="btn-refresh">🔄 Refresh</button>
              <button class="btn btn-green" id="btn-quick-sale">+ Quick Sale</button>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-icon">📦</span>
              <div class="kpi-value color-blue" id="kpi-products">${KPI.totalProducts.toLocaleString()}</div>
              <div class="kpi-label">Total Products</div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">💰</span>
              <div class="kpi-value color-green" id="kpi-sales">${peso(KPI.todaysSales)}</div>
              <div class="kpi-label">Today's Sales</div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">↩️</span>
              <div class="kpi-value color-amber" id="kpi-returns">${KPI.pendingReturns}</div>
              <div class="kpi-label">Pending Returns</div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">⚠️</span>
              <div class="kpi-value color-red" id="kpi-lowstock">${KPI.lowStockItems}</div>
              <div class="kpi-label">Low Stock Items</div>
            </div>
          </div>

          <!-- Panels -->
          <div class="panel-grid">

            <!-- Low Stock Alerts -->
            <div class="card">
              <div class="panel-header">
                <div class="panel-title">Low Stock Alerts</div>
                <input class="panel-search" id="search-lowstock" type="text" placeholder="🔍 Search..."/>
              </div>
              <div id="low-stock-list">${lowStockRows(LOW_STOCK)}</div>
            </div>

            <!-- Recent Sales -->
            <div class="card">
              <div class="panel-header">
                <div class="panel-title">Recent Sales</div>
                <input class="panel-search" id="search-sales" type="text" placeholder="🔍 Search..."/>
              </div>
              <div id="recent-sales-list">${salesRows(RECENT_SALES)}</div>
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

  // Help FAB
  document.getElementById('btn-help').addEventListener('click', () => {
    showToast('💡 Use the sidebar to navigate between modules.');
  });

  // Search — Low Stock
  document.getElementById('search-lowstock').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.getElementById('low-stock-list').innerHTML =
      lowStockRows(LOW_STOCK.filter(i => i.name.toLowerCase().includes(q)));
  });

  // Search — Recent Sales
  document.getElementById('search-sales').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.getElementById('recent-sales-list').innerHTML =
      salesRows(RECENT_SALES.filter(i => i.customer.toLowerCase().includes(q)));
  });

  // Refresh
  document.getElementById('btn-refresh').addEventListener('click', function () {
    this.textContent = '⏳ Refreshing...';
    this.disabled = true;
    const btn = this;
    setTimeout(() => {
      document.getElementById('low-stock-list').innerHTML  = lowStockRows(LOW_STOCK);
      document.getElementById('recent-sales-list').innerHTML = salesRows(RECENT_SALES);
      showToast('Dashboard refreshed!');
      btn.textContent = '🔄 Refresh';
      btn.disabled = false;
    }, 900);
  });

  // Quick Sale — open modal
  document.getElementById('btn-quick-sale').addEventListener('click', () => {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">🧾 Quick Add Sale</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Customer Name</label>
              <input class="form-input" id="field-customer" type="text" placeholder="e.g. Acme Corp" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Employee</label>
              <select class="form-input" id="field-employee">
                <option>Juan dela Cruz</option>
                <option>Maria Santos</option>
                <option>Rico Reyes</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Total Amount (₱)</label>
              <input class="form-input" id="field-amount" type="number" min="1" placeholder="e.g. 1500" required/>
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
      const customer = document.getElementById('field-customer').value.trim();
      const amount   = parseFloat(document.getElementById('field-amount').value);

      if (!customer || isNaN(amount)) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      RECENT_SALES.unshift({ customer, amount, status: 'pending' });
      KPI.todaysSales += amount;

      document.getElementById('kpi-sales').textContent = peso(KPI.todaysSales);
      document.getElementById('recent-sales-list').innerHTML = salesRows(RECENT_SALES);

      closeModal();
      showToast(`Sale for ${customer} added!`);
    });
  });

})();