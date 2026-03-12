// ================================================================
//  supplies.js — StockPilot Supplies (Supabase connected)
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
        <a href="supplies.html"   class="nav-item active"><span class="nav-icon">🚚</span> Supplies</a>
        <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
        <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
        <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
        <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
        <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
      </nav>
      <div class="sidebar-footer">👤 Maria Santos</div>
    </aside>`;

  let SUPPLIES = [], SUPPLIERS = [], EMPLOYEES = [], filtered = [];

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }
  function peso(n) { return '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">No supplies found.</td></tr>`;
    return list.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.supply_date}</td>
        <td class="td-bold">${s.supplier?.supplier_name || '—'}</td>
        <td>${s.employee?.full_name || '—'}</td>
        <td style="color:#a78bfa;font-weight:700;">${peso(s.total_amount)}</td>
      </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('supplies-tbody').innerHTML = tableRows(filtered);
    document.getElementById('supplies-count').textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;
  }

  async function loadSupplies() {
    const { data } = await db.from('supply')
      .select('*, supplier(supplier_name), employee(full_name)')
      .order('supply_date', { ascending: false });
    SUPPLIES = data || []; filtered = [...SUPPLIES]; renderTable();
  }

  async function loadLookups() {
    const [{ data: s }, { data: e }] = await Promise.all([
      db.from('supplier').select('supplier_id, supplier_name').order('supplier_name'),
      db.from('employee').select('employee_id, full_name').order('full_name'),
    ]);
    SUPPLIERS = s || []; EMPLOYEES = e || [];
  }

  function applyFilters() {
    const q   = (document.getElementById('search-supplies')?.value || '').toLowerCase();
    const emp = document.getElementById('filter-employee')?.value || '';
    filtered = SUPPLIES.filter(s => {
      const mQ = !q   || (s.supplier?.supplier_name || '').toLowerCase().includes(q) || s.supply_date.includes(q);
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
          <div class="modal-header"><div class="modal-title">🚚 Record Supply</div><button class="modal-close" id="modal-close">✕</button></div>
          <form id="modal-form">
            <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="${today}" required/></div>
            <div class="form-group"><label class="form-label">Supplier</label>
              <select class="form-input" id="f-supplier">${SUPPLIERS.map(s => `<option value="${s.supplier_id}">${s.supplier_name}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Processed By</label>
              <select class="form-input" id="f-employee">${EMPLOYEES.map(e => `<option value="${e.employee_id}">${e.full_name}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Total Amount (₱)</label><input class="form-input" id="f-total" type="number" min="0" step="0.01" placeholder="0.00" required/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="modal-cancel">Cancel</button><button type="submit" class="btn btn-purple">Save Supply</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const { error } = await db.from('supply').insert({
        supply_date:  document.getElementById('f-date').value,
        supplier_id:  parseInt(document.getElementById('f-supplier').value),
        employee_id:  parseInt(document.getElementById('f-employee').value),
        total_amount: parseFloat(document.getElementById('f-total').value),
      });
      if (error) { showToast('Error saving supply.', 'error'); return; }
      closeModal(); await loadSupplies(); showToast('Supply recorded!');
    });
  }

  document.getElementById('app').innerHTML = `
    <div class="app">${SIDEBAR}
      <main class="main"><div id="pageContent">
        <div class="page-header"><h1 class="page-title">Supplies</h1><button class="btn btn-purple" id="btn-add">+ Record Supply</button></div>
        <div class="toolbar" style="margin-bottom:16px;">
          <input class="search-input" id="search-supplies" type="text" placeholder="🔍 Search supplier or date..."/>
          <select class="filter-select" id="filter-employee"><option value="">All Employees</option></select>
          <span id="supplies-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;">Loading...</span>
        </div>
        <div class="card" style="padding:0;overflow:hidden;"><div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Date</th><th>Supplier</th><th>Processed By</th><th>Total</th></tr></thead>
          <tbody id="supplies-tbody"><tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
        </table></div></div>
      </div></main>
    </div>
    <div id="modalSlot"></div><div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>`;

  await loadLookups();
  document.getElementById('filter-employee').innerHTML = `<option value="">All Employees</option>${EMPLOYEES.map(e => `<option value="${e.employee_id}">${e.full_name}</option>`).join('')}`;
  await loadSupplies();

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-supplies').addEventListener('input', applyFilters);
  document.getElementById('filter-employee').addEventListener('change', applyFilters);

})();