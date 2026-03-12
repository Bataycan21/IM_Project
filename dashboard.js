// ================================================================
//  dashboard.js — StockPilot Dashboard (Supabase connected)
// ================================================================

(async function () {

  // ── Sidebar ───────────────────────────────────────────────────
  const SIDEBAR = `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-title">⚙️ STOCK<span class="logo-accent">PILOT</span></div>
        <div class="logo-sub">Hardware &amp; Motor Parts</div>
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
    </aside>`;

  // ── Shell ─────────────────────────────────────────────────────
  document.getElementById('app').innerHTML = `
    <div class="app">
      ${SIDEBAR}
      <main class="main">
        <div id="pageContent">
          <div class="page-header">
            <div>
              <div class="dashboard-date" id="dashboard-date"></div>
              <h1 class="page-title">Dashboard</h1>
            </div>
            <div style="display:flex;gap:10px;">
              <button class="btn btn-ghost" id="btn-refresh">🔄 Refresh</button>
              <button class="btn btn-red"   id="btn-quick-sale">+ Quick Sale</button>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card"><span class="kpi-icon">📦</span><div class="kpi-value color-blue"  id="kpi-products">—</div><div class="kpi-label">Total Products</div></div>
            <div class="kpi-card"><span class="kpi-icon">💰</span><div class="kpi-value color-green" id="kpi-sales">—</div><div class="kpi-label">Today's Sales</div></div>
            <div class="kpi-card"><span class="kpi-icon">↩️</span><div class="kpi-value color-amber" id="kpi-returns">—</div><div class="kpi-label">Pending Returns</div></div>
            <div class="kpi-card"><span class="kpi-icon">⚠️</span><div class="kpi-value color-red"   id="kpi-lowstock">—</div><div class="kpi-label">Low Stock Items</div></div>
          </div>

          <!-- Panels -->
          <div class="panel-grid">
            <div class="card">
              <div class="panel-header">
                <div class="panel-title">Low Stock Alerts</div>
                <input class="panel-search" id="search-lowstock" type="text" placeholder="🔍 Search..."/>
              </div>
              <div id="low-stock-list"><div class="empty-state">Loading...</div></div>
            </div>
            <div class="card">
              <div class="panel-header">
                <div class="panel-title">Recent Sales</div>
                <input class="panel-search" id="search-sales" type="text" placeholder="🔍 Search..."/>
              </div>
              <div id="recent-sales-list"><div class="empty-state">Loading...</div></div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>
  `;

  // ── Helpers ───────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  document.getElementById('dashboard-date').textContent = today;

  function peso(n) { return '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }

  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }

  // ── Fetch & Render ────────────────────────────────────────────
  async function loadDashboard() {
    // KPI: total products
    const { count: totalProducts } = await db.from('product').select('*', { count: 'exact', head: true });

    // KPI: today's sales
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: todaySales } = await db.from('sale').select('total_amount').eq('sale_date', todayStr);
    const todayTotal = (todaySales || []).reduce((s, r) => s + parseFloat(r.total_amount), 0);

    // KPI: pending returns
    const { count: pendingReturns } = await db.from('return').select('*', { count: 'exact', head: true });

    // KPI: low stock
    const { data: allProducts } = await db.from('product').select('quantity, reorder_level');
    const lowStockCount = (allProducts || []).filter(p => p.quantity <= p.reorder_level).length;

    document.getElementById('kpi-products').textContent = (totalProducts || 0).toLocaleString();
    document.getElementById('kpi-sales').textContent    = peso(todayTotal);
    document.getElementById('kpi-returns').textContent  = pendingReturns || 0;
    document.getElementById('kpi-lowstock').textContent = lowStockCount;

    // Low Stock List
    const { data: lowStock } = await db.from('product')
      .select('product_name, quantity, reorder_level')
      .order('quantity', { ascending: true })
      .limit(10);

    const lowItems = (lowStock || []).filter(p => p.quantity <= p.reorder_level);
    renderLowStock(lowItems);

    // Recent Sales
    const { data: sales } = await db.from('sale')
      .select('total_amount, sale_date, customer(full_name)')
      .order('sale_date', { ascending: false })
      .limit(8);

    renderSales(sales || []);
  }

  let _lowStock = [], _sales = [];

  function renderLowStock(items) {
    _lowStock = items;
    const q = (document.getElementById('search-lowstock')?.value || '').toLowerCase();
    const filtered = items.filter(i => i.product_name.toLowerCase().includes(q));
    document.getElementById('low-stock-list').innerHTML = filtered.length
      ? filtered.map(i => {
          const crit = i.quantity === 0 || i.quantity <= i.reorder_level / 2;
          return `<div class="list-row">
            <div>
              <div class="list-row-name">${i.product_name}</div>
              <div class="list-row-sub">Qty: ${i.quantity} · Reorder at: ${i.reorder_level}</div>
            </div>
            <span class="badge ${crit ? 'badge-red' : 'badge-yellow'}">${crit ? 'Critical' : 'Low Stock'}</span>
          </div>`;
        }).join('')
      : `<div class="empty-state">No low stock items.</div>`;
  }

  function renderSales(items) {
    _sales = items;
    const q = (document.getElementById('search-sales')?.value || '').toLowerCase();
    const filtered = items.filter(i => (i.customer?.full_name || '').toLowerCase().includes(q));
    document.getElementById('recent-sales-list').innerHTML = filtered.length
      ? filtered.map(i => `<div class="list-row">
          <div>
            <div class="list-row-name">${i.customer?.full_name || 'Walk-in'}</div>
            <div class="list-row-sub list-row-amount">${peso(i.total_amount)}</div>
          </div>
          <span class="badge badge-green">Completed</span>
        </div>`).join('')
      : `<div class="empty-state">No sales found.</div>`;
  }

  await loadDashboard();

  // ── Events ────────────────────────────────────────────────────
  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate between modules.'));

  document.getElementById('search-lowstock').addEventListener('input', function () { renderLowStock(_lowStock); });
  document.getElementById('search-sales').addEventListener('input', function () { renderSales(_sales); });

  document.getElementById('btn-refresh').addEventListener('click', async function () {
    this.textContent = '⏳ Refreshing...'; this.disabled = true;
    await loadDashboard();
    showToast('Dashboard refreshed!');
    this.textContent = '🔄 Refresh'; this.disabled = false;
  });

  // Quick Sale Modal
  document.getElementById('btn-quick-sale').addEventListener('click', async () => {
    const { data: customers } = await db.from('customer').select('customer_id, full_name').order('full_name');
    const { data: employees } = await db.from('employee').select('employee_id, full_name').order('full_name');
    const todayVal = new Date().toISOString().split('T')[0];

    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">🧾 Quick Sale</div>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="modal-form">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="f-date" type="date" value="${todayVal}" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Customer</label>
              <select class="form-input" id="f-customer">
                ${(customers || []).map(c => `<option value="${c.customer_id}">${c.full_name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Employee</label>
              <select class="form-input" id="f-employee">
                ${(employees || []).map(e => `<option value="${e.employee_id}">${e.full_name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Total Amount (₱)</label>
              <input class="form-input" id="f-total" type="number" min="0" step="0.01" placeholder="0.00" required/>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-red">Save Sale</button>
            </div>
          </form>
        </div>
      </div>`;

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const sale_date   = document.getElementById('f-date').value;
      const customer_id = parseInt(document.getElementById('f-customer').value);
      const employee_id = parseInt(document.getElementById('f-employee').value);
      const total_amount= parseFloat(document.getElementById('f-total').value);

      if (isNaN(total_amount)) { showToast('Please fill all fields.', 'error'); return; }

      const { error } = await db.from('sale').insert({ sale_date, customer_id, employee_id, total_amount });
      if (error) { showToast('Error saving sale.', 'error'); return; }

      closeModal();
      await loadDashboard();
      showToast('Sale saved!');
    });
  });

})();