// ================================================================
//  returns.js — StockPilot Returns (Supabase connected)
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
        <a href="returns.html"    class="nav-item active"><span class="nav-icon">↩️</span> Returns</a>
        <a href="stockouts.html"  class="nav-item"><span class="nav-icon">⚠️</span> Stock-Outs</a>
        <a href="customers.html"  class="nav-item"><span class="nav-icon">👥</span> Customers</a>
        <a href="employees.html"  class="nav-item"><span class="nav-icon">👤</span> Employees</a>
        <a href="suppliers.html"  class="nav-item"><span class="nav-icon">🏭</span> Suppliers</a>
      </nav>
      <div class="sidebar-footer">👤 Maria Santos</div>
    </aside>`;

  let RETURNS = [], SALE_ITEMS = [], filtered = [];

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }

  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">No returns found.</td></tr>`;
    return list.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.return_date}</td>
        <td class="td-bold">${r.sale_item?.product?.product_name || '—'}</td>
        <td style="color:#f87171;font-weight:700;">${r.quantity}</td>
        <td>${r.reason || '—'}</td>
      </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('returns-tbody').innerHTML = tableRows(filtered);
    document.getElementById('returns-count').textContent = `${filtered.length} return${filtered.length !== 1 ? 's' : ''}`;
  }

  async function loadReturns() {
    const { data } = await db.from('return')
      .select('*, sale_item(product(product_name))')
      .order('return_date', { ascending: false });
    RETURNS = data || []; filtered = [...RETURNS]; renderTable();
  }

  async function loadLookups() {
    const { data } = await db.from('sale_item')
      .select('sale_item_id, product(product_name)')
      .order('sale_item_id');
    SALE_ITEMS = data || [];
  }

  const REASONS = ['Defective', 'Wrong item', 'Customer request', 'Quality issue', 'Damaged', 'Other'];

  function applyFilters() {
    const q = (document.getElementById('search-returns')?.value || '').toLowerCase();
    filtered = RETURNS.filter(r => {
      return !q || (r.sale_item?.product?.product_name || '').toLowerCase().includes(q) || (r.reason || '').toLowerCase().includes(q) || r.return_date.includes(q);
    });
    renderTable();
  }

  function openModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header"><div class="modal-title">↩️ Log Return</div><button class="modal-close" id="modal-close">✕</button></div>
          <form id="modal-form">
            <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="${today}" required/></div>
            <div class="form-group"><label class="form-label">Sale Item</label>
              <select class="form-input" id="f-saleitem">
                ${SALE_ITEMS.map(si => `<option value="${si.sale_item_id}">${si.product?.product_name || 'Item #' + si.sale_item_id}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="form-label">Quantity</label><input class="form-input" id="f-qty" type="number" min="1" placeholder="1" required/></div>
            <div class="form-group"><label class="form-label">Reason</label>
              <select class="form-input" id="f-reason">${REASONS.map(r => `<option value="${r}">${r}</option>`).join('')}</select>
            </div>
            <div class="modal-footer"><button type="button" class="btn-ghost" id="modal-cancel">Cancel</button><button type="submit" class="btn btn-amber">Log Return</button></div>
          </form>
        </div>
      </div>`;
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const { error } = await db.from('return').insert({
        return_date:  document.getElementById('f-date').value,
        sale_item_id: parseInt(document.getElementById('f-saleitem').value),
        quantity:     parseInt(document.getElementById('f-qty').value),
        reason:       document.getElementById('f-reason').value,
      });
      if (error) { showToast('Error logging return.', 'error'); return; }
      closeModal(); await loadReturns(); showToast('Return logged!');
    });
  }

  document.getElementById('app').innerHTML = `
    <div class="app">${SIDEBAR}
      <main class="main"><div id="pageContent">
        <div class="page-header"><h1 class="page-title">Returns</h1><button class="btn btn-amber" id="btn-add">+ Log Return</button></div>
        <div class="toolbar" style="margin-bottom:16px;">
          <input class="search-input" id="search-returns" type="text" placeholder="🔍 Search product or reason..."/>
          <span id="returns-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;">Loading...</span>
        </div>
        <div class="card" style="padding:0;overflow:hidden;"><div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Date</th><th>Product</th><th>Qty</th><th>Reason</th></tr></thead>
          <tbody id="returns-tbody"><tr><td colspan="5" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
        </table></div></div>
      </div></main>
    </div>
    <div id="modalSlot"></div><div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>`;

  await loadLookups();
  await loadReturns();

  document.getElementById('btn-help').addEventListener('click', () => showToast('💡 Use the sidebar to navigate.'));
  document.getElementById('btn-add').addEventListener('click', openModal);
  document.getElementById('search-returns').addEventListener('input', applyFilters);

})();