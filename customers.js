// ================================================================
//  customers.js — StockPilot Customers (Supabase connected)
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
        <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
        <a href="customers.html"  class="nav-item active"><span class="nav-icon">👥</span> Customers</a>
        <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
        <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
      </nav>
      <div class="sidebar-footer">👤 Maria Santos</div>
    </aside>`;

  let CUSTOMERS = [], CTYPES = [], filtered = [];

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }

  function typeBadge(typeName) {
    return typeName === 'Corporate'
      ? `<span class="badge badge-blue">Corporate</span>`
      : `<span class="badge badge-green">Retail</span>`;
  }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">No customers found.</td></tr>`;
    return list.map((c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="td-bold">${c.full_name}</td>
        <td>${typeBadge(c.customer_type?.type_name || '')}</td>
        <td>${c.contact_number || '—'}</td>
      </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('customers-tbody').innerHTML = tableRows(filtered);
    document.getElementById('customers-count').textContent = `${filtered.length} customer${filtered.length !== 1 ? 's' : ''}`;
  }

  async function loadCustomers() {
    const { data } = await db.from('customer')
      .select('*, customer_type(type_name)')
      .order('full_name');
    CUSTOMERS = data || []; filtered = [...CUSTOMERS]; renderTable();
  }

  async function loadLookups() {
    const { data } = await db.from('customer_type').select('*').order('type_name');
    CTYPES = data || [];
  }

  function applyFilters() {
    const q    = (document.getElementById('search-customers')?.value || '').toLowerCase();
    const type = document.getElementById('filter-type')?.value || '';
    filtered = CUSTOMERS.filter(c => {
      const mQ = !q    || c.full_name.toLowerCase().includes(q) || (c.contact_number || '').includes(q);
      const mT = !type || String(c.customer_type_id) === type;
      return mQ && mT;
    });
    renderTable();
  }

  function openModal() {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">👥 Add Customer</div><button class="modal-close" id="modal-close">✕</button></div>
          <form id="modal-form">
            <div class="form-group"><label class="form-label">Customer Name</label><input class="form-input" id="f-name" type="text" placeholder="e.g. Acme Corp" required/></div>
            <div class="form-group"><label class="form-label">Type</label>
              <select class="form-input" id="f-type">${CTYPES.map(ct => `<option value="${ct.customer_type_id}">${ct.type_name}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Contact Number</label><input class="form-input" id="f-contact" type="text" placeholder="e.g. +63 912 345 6789"/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="modal-cancel">Cancel</button><button type="submit" class="btn btn-red">Save Customer</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('f-name').value.trim();
      if (!name) { showToast('Name is required.', 'error'); return; }
      const { error } = await db.from('customer').insert({
        full_name:        name,
        customer_type_id: parseInt(document.getElementById('f-type').value),
        contact_number:   document.getElementById('f-contact').value.trim(),
      });
      if (error) { showToast('Error saving customer.', 'error'); return; }
      closeModal(); await loadCustomers(); showToast(`"${name}" added!`);
    });
  }

  document.getElementById('app').innerHTML = `
    <div class="app">${SIDEBAR}
      <main class="main"><div id="pageContent">
        <div class="page-header"><h1 class="page-title">Customers</h1><button class="btn btn-red" id="btn-add">+ Add Customer</button></div>
        <div class="toolbar" style="margin-bottom:16px;">
          <input class="search-input" id="search-customers" type="text" placeholder="🔍 Search name or contact..."/>
          <select class="filter-select" id="filter-type"><option value="">All Types</option></select>
          <span id="customers-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;">Loading...</span>
        </div>
        <div class="card" style="padding:0;overflow:hidden;"><div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Name</th><th>Type</th><th>Contact</th></tr></thead>
          <tbody id="customers-tbody"><tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
        </table></div></div>
      </div></main>
    </div>
    <div id="modalSlot"></div><div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>`;

  await loadLookups();
  document.getElementById('filter-type').innerHTML = `<option value="">All Types</option>${CTYPES.map(ct => `<option value="${ct.customer_type_id}">${ct.type_name}</option>`).join('')}`;
  await loadCustomers();

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-customers').addEventListener('input', applyFilters);
  document.getElementById('filter-type').addEventListener('change', applyFilters);

})();