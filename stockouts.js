// ================================================================
//  stockouts.js — StockPilot Stock-Outs (Supabase connected)
// ================================================================

(async function () {

  const SIDEBAR = `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-title">⚙️ Joe Hardware<span class="logo-accent">and Motorparts</span></div>
        <div class="logo-sub">Hardware &amp; Motor Parts</div>
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
    </aside>`;

  let STOCKOUTS = [], PRODUCTS = [], EMPLOYEES = [], filtered = [];

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="6" class="td-muted" style="text-align:center;padding:32px;">No stock-outs found.</td></tr>`;
    return list.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.stockout_date}</td>
        <td class="td-bold">${s.product?.product_name || '—'}</td>
        <td style="color:#f87171;font-weight:700;">${s.quantity}</td>
        <td>${s.employee?.full_name || '—'}</td>
        <td class="td-muted">${s.stockout_description || '—'}</td>
      </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('stockouts-tbody').innerHTML = tableRows(filtered);
    document.getElementById('stockouts-count').textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;
  }

  async function loadStockouts() {
    const { data } = await db.from('stock_out')
      .select('*, product(product_name), employee(full_name)')
      .order('stockout_date', { ascending: false });
    STOCKOUTS = data || []; filtered = [...STOCKOUTS]; renderTable();
  }

  async function loadLookups() {
    const [{ data: p }, { data: e }] = await Promise.all([
      db.from('product').select('product_id, product_name').order('product_name'),
      db.from('employee').select('employee_id, full_name').order('full_name'),
    ]);
    PRODUCTS = p || []; EMPLOYEES = e || [];
  }

  function applyFilters() {
    const q   = (document.getElementById('search-stockouts')?.value || '').toLowerCase();
    const emp = document.getElementById('filter-employee')?.value || '';
    filtered = STOCKOUTS.filter(s => {
      const mQ = !q   || (s.product?.product_name || '').toLowerCase().includes(q) || (s.stockout_description || '').toLowerCase().includes(q) || s.stockout_date.includes(q);
      const mE = !emp || String(s.employee_id) === emp;
      return mQ && mE;
    });
    renderTable();
  }

  function openModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">⚠️ Record Stock-Out</div><button class="modal-close" id="modal-close">✕</button></div>
          <form id="modal-form">
            <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="${today}" required/></div>
            <div class="form-group"><label class="form-label">Product</label>
              <select class="form-input" id="f-product">${PRODUCTS.map(p => `<option value="${p.product_id}">${p.product_name}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Quantity</label><input class="form-input" id="f-qty" type="number" min="1" placeholder="1" required/></div>
            <div class="form-group"><label class="form-label">Employee</label>
              <select class="form-input" id="f-employee">${EMPLOYEES.map(e => `<option value="${e.employee_id}">${e.full_name}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="f-desc" type="text" placeholder="e.g. Delayed shipment..."/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="modal-cancel">Cancel</button><button type="submit" class="btn btn-red">Record</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const { error } = await db.from('stock_out').insert({
        stockout_date:        document.getElementById('f-date').value,
        product_id:           parseInt(document.getElementById('f-product').value),
        quantity:             parseInt(document.getElementById('f-qty').value),
        employee_id:          parseInt(document.getElementById('f-employee').value),
        stockout_description: document.getElementById('f-desc').value,
      });
      if (error) { showToast('Error recording stock-out.', 'error'); return; }
      closeModal(); await loadStockouts(); showToast('Stock-out recorded!');
    });
  }

  document.getElementById('app').innerHTML = `
    <div class="app">${SIDEBAR}
      <main class="main"><div id="pageContent">
        <div class="page-header"><h1 class="page-title">Stock-Outs</h1><button class="btn btn-red" id="btn-add">+ Record Stock-Out</button></div>
        <div class="toolbar" style="margin-bottom:16px;">
          <input class="search-input" id="search-stockouts" type="text" placeholder="🔍 Search product or description..."/>
          <select class="filter-select" id="filter-employee"><option value="">All Employees</option></select>
          <span id="stockouts-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;">Loading...</span>
        </div>
        <div class="card" style="padding:0;overflow:hidden;"><div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Date</th><th>Product</th><th>Qty</th><th>Employee</th><th>Description</th></tr></thead>
          <tbody id="stockouts-tbody"><tr><td colspan="6" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
        </table></div></div>
      </div></main>
    </div>
    <div id="modalSlot"></div><div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>`;

  await loadLookups();
  document.getElementById('filter-employee').innerHTML = `<option value="">All Employees</option>${EMPLOYEES.map(e => `<option value="${e.employee_id}">${e.full_name}</option>`).join('')}`;
  await loadStockouts();

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-stockouts').addEventListener('input', applyFilters);
  document.getElementById('filter-employee').addEventListener('change', applyFilters);

})();