// ================================================================
//  suppliers.js — StockPilot Suppliers (Supabase connected)
// ================================================================

(async function () {

  const SIDEBAR = `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-title">⚙️ STOCK<span class="logo-accent">PILOT</span></div>
        <div class="logo-sub">Hardware &amp; Motor Parts</div>
      </div>
      <nav class="sidebar-nav">
        <a href="dashboard.html"  class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
        <a href="products.html"   class="nav-item"><span class="nav-icon">📦</span> Products</a>
        <a href="sales.html"      class="nav-item"><span class="nav-icon">🧾</span> Sales</a>
        <a href="supplies.html"   class="nav-item"><span class="nav-icon">🚚</span> Supplies</a>
        <a href="returns.html"    class="nav-item"><span class="nav-icon">↩️</span> Returns</a>
        <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
        <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
        <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
        <a href="suppliers.html"  class="nav-item active"><span class="nav-icon">🏭</span> Suppliers</a>
      </nav>
      <div class="sidebar-footer">👤 Maria Santos</div>
    </aside>`;

  let SUPPLIERS = [], filtered = [];

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">No suppliers found.</td></tr>`;
    return list.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="td-bold">${s.supplier_name}</td>
        <td>${s.contact_number || '—'}</td>
        <td class="td-muted">${s.address || '—'}</td>
      </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('suppliers-tbody').innerHTML = tableRows(filtered);
    document.getElementById('suppliers-count').textContent = `${filtered.length} supplier${filtered.length !== 1 ? 's' : ''}`;
  }

  async function loadSuppliers() {
    const { data } = await db.from('supplier').select('*').order('supplier_name');
    SUPPLIERS = data || []; filtered = [...SUPPLIERS]; renderTable();
  }

  function applyFilters() {
    const q = (document.getElementById('search-suppliers')?.value || '').toLowerCase();
    filtered = SUPPLIERS.filter(s =>
      !q || s.supplier_name.toLowerCase().includes(q) || (s.contact_number || '').includes(q) || (s.address || '').toLowerCase().includes(q)
    );
    renderTable();
  }

  function openModal() {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">🏭 Add Supplier</div><button class="modal-close" id="modal-close">✕</button></div>
          <form id="modal-form">
            <div class="form-group"><label class="form-label">Supplier Name</label><input class="form-input" id="f-name" type="text" placeholder="e.g. Tech Distributors Ltd." required/></div>
            <div class="form-group"><label class="form-label">Contact Number</label><input class="form-input" id="f-contact" type="text" placeholder="e.g. +1 (555) 000-0000"/></div>
            <div class="form-group"><label class="form-label">Address</label><input class="form-input" id="f-address" type="text" placeholder="e.g. 123 Main St, City, ST 00000"/></div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="modal-cancel">Cancel</button><button type="submit" class="btn btn-red">Save Supplier</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('f-name').value.trim();
      if (!name) { showToast('Supplier name is required.', 'error'); return; }
      const { error } = await db.from('supplier').insert({
        supplier_name:  name,
        contact_number: document.getElementById('f-contact').value.trim(),
        address:        document.getElementById('f-address').value.trim(),
      });
      if (error) { showToast('Error saving supplier.', 'error'); return; }
      closeModal(); await loadSuppliers(); showToast(`"${name}" added!`);
    });
  }

  document.getElementById('app').innerHTML = `
    <div class="app">${SIDEBAR}
      <main class="main"><div id="pageContent">
        <div class="page-header"><h1 class="page-title">Suppliers</h1><button class="btn btn-red" id="btn-add">+ Add Supplier</button></div>
        <div class="toolbar" style="margin-bottom:16px;">
          <input class="search-input" id="search-suppliers" type="text" placeholder="🔍 Search name, contact, or address..."/>
          <span id="suppliers-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;">Loading...</span>
        </div>
        <div class="card" style="padding:0;overflow:hidden;"><div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Supplier Name</th><th>Contact</th><th>Address</th></tr></thead>
          <tbody id="suppliers-tbody"><tr><td colspan="4" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
        </table></div></div>
      </div></main>
    </div>
    <div id="modalSlot"></div><div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>`;

  await loadSuppliers();

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-suppliers').addEventListener('input', applyFilters);

})();