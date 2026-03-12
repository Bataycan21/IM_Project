// ================================================================
//  products.js — StockPilot Products (Supabase + Delete/Edit)
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
        <a href="products.html"   class="nav-item active"><span class="nav-icon">📦</span> Products</a>
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

  let PRODUCTS = [], CATEGORIES = [], BRANDS = [], UNITS = [];
  let filtered = [];

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast toast-${type} toast-show`;
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('toast-show'), 2800);
  }
  function closeModal() { document.getElementById('modalSlot').innerHTML = ''; }
  function isLow(p) { return p.quantity <= p.reorder_level; }

  // ── Table rows with Actions column ────────────────────────────
  function tableRows(list) {
    if (!list.length) return `<tr><td colspan="10" class="td-muted" style="text-align:center;padding:32px;">No products found.</td></tr>`;
    return list.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="td-bold">${p.product_name}</td>
        <td>${p.category?.category_name || '—'}</td>
        <td>${p.brand?.brand_name || '—'}</td>
        <td>${p.unit?.unit_type || '—'}</td>
        <td style="${isLow(p) ? 'color:#f87171;font-weight:700;' : 'color:#22c55e;font-weight:700;'}">${p.quantity}</td>
        <td>${p.reorder_level}</td>
        <td>&#8369;${parseFloat(p.price).toFixed(2)}</td>
        <td>${isLow(p) ? '<span class="badge badge-red">Low Stock</span>' : '<span class="badge badge-green">In Stock</span>'}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-action btn-edit-row"   data-id="${p.product_id}" title="Edit">&#x270F;&#xFE0F;</button>
            <button class="btn-action btn-delete-row" data-id="${p.product_id}" data-name="${p.product_name.replace(/"/g,'&quot;')}" title="Delete">&#x1F5D1;&#xFE0F;</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function renderTable() {
    document.getElementById('product-tbody').innerHTML = tableRows(filtered);
    document.getElementById('product-count').textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
    // attach row-level button listeners
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', () => confirmDelete(parseInt(btn.dataset.id), btn.dataset.name));
    });
    document.querySelectorAll('.btn-edit-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = PRODUCTS.find(p => p.product_id === parseInt(btn.dataset.id));
        if (prod) openEditModal(prod);
      });
    });
  }

  async function loadProducts() {
    const { data } = await db.from('product')
      .select('*, category(category_name), brand(brand_name), unit(unit_type)')
      .order('product_name');
    PRODUCTS = data || [];
    filtered = [...PRODUCTS];
    renderTable();
  }

  async function loadLookups() {
    const [{ data: cats }, { data: brnds }, { data: unts }] = await Promise.all([
      db.from('category').select('*').order('category_name'),
      db.from('brand').select('*').order('brand_name'),
      db.from('unit').select('*').order('unit_type'),
    ]);
    CATEGORIES = cats || []; BRANDS = brnds || []; UNITS = unts || [];
  }

  function applyFilters() {
    const q   = (document.getElementById('search-products')?.value || '').toLowerCase();
    const cat = document.getElementById('filter-category')?.value || '';
    const brd = document.getElementById('filter-brand')?.value || '';
    filtered = PRODUCTS.filter(p => {
      const mQ = !q   || p.product_name.toLowerCase().includes(q) || (p.brand?.brand_name || '').toLowerCase().includes(q);
      const mC = !cat || String(p.category_id) === cat;
      const mB = !brd || String(p.brand_id) === brd;
      return mQ && mC && mB;
    });
    renderTable();
  }

  // ── Delete Confirmation Modal ─────────────────────────────────
  function confirmDelete(id, name) {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box" style="max-width:380px;text-align:center;">
          <div style="font-size:42px;margin-bottom:12px;">&#x1F6A8;</div>
          <div class="modal-title" style="color:#f87171;margin-bottom:12px;">Delete Product?</div>
          <p style="color:var(--text-dim);margin-bottom:6px;line-height:1.7;">
            You are about to permanently delete<br/>
            <strong style="color:#fff;">"${name}"</strong><br/>
            <span style="color:#f87171;font-size:12px;font-weight:700;">This action cannot be undone.</span>
          </p>
          <div class="modal-footer" style="justify-content:center;margin-top:22px;">
            <button class="btn-ghost" id="modal-cancel">Cancel</button>
            <button class="btn btn-red" id="btn-confirm-delete">Yes, Delete It</button>
          </div>
        </div>
      </div>`;
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
      const { error } = await db.from('product').delete().eq('product_id', id);
      if (error) { showToast('Cannot delete — product may be used in sales or other records.', 'error'); closeModal(); return; }
      closeModal();
      await loadProducts();
      showToast(`"${name}" deleted.`, 'error');
    });
  }

  // ── Edit Modal ────────────────────────────────────────────────
  function openEditModal(p) {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">&#x270F;&#xFE0F; Edit Product</div>
            <button class="modal-close" id="modal-close">&#x2715;</button>
          </div>
          <form id="modal-form">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group" style="grid-column:1/-1;">
                <label class="form-label">Product Name</label>
                <input class="form-input" id="f-name" type="text" value="${p.product_name}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-input" id="f-category">
                  ${CATEGORIES.map(c => `<option value="${c.category_id}" ${c.category_id === p.category_id ? 'selected' : ''}>${c.category_name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Brand</label>
                <select class="form-input" id="f-brand">
                  ${BRANDS.map(b => `<option value="${b.brand_id}" ${b.brand_id === p.brand_id ? 'selected' : ''}>${b.brand_name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Unit</label>
                <select class="form-input" id="f-unit">
                  ${UNITS.map(u => `<option value="${u.unit_id}" ${u.unit_id === p.unit_id ? 'selected' : ''}>${u.unit_type}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Price (&#8369;)</label>
                <input class="form-input" id="f-price" type="number" min="0" step="0.01" value="${p.price}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input class="form-input" id="f-qty" type="number" min="0" value="${p.quantity}" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Reorder Level</label>
                <input class="form-input" id="f-reorder" type="number" min="0" value="${p.reorder_level}" required/>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-red">Save Changes</button>
            </div>
          </form>
        </div>
      </div>`;
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        product_name:  document.getElementById('f-name').value.trim(),
        category_id:   parseInt(document.getElementById('f-category').value),
        brand_id:      parseInt(document.getElementById('f-brand').value),
        unit_id:       parseInt(document.getElementById('f-unit').value),
        price:         parseFloat(document.getElementById('f-price').value),
        quantity:      parseInt(document.getElementById('f-qty').value),
        reorder_level: parseInt(document.getElementById('f-reorder').value),
      };
      const { error } = await db.from('product').update(payload).eq('product_id', p.product_id);
      if (error) { showToast('Error updating product.', 'error'); return; }
      closeModal(); await loadProducts(); showToast(`"${payload.product_name}" updated!`);
    });
  }

  // ── Add Modal ─────────────────────────────────────────────────
  function openAddModal() {
    document.getElementById('modalSlot').innerHTML = `
      <div class="modal modal-open" id="modal">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">&#x1F4E6; Add Product</div>
            <button class="modal-close" id="modal-close">&#x2715;</button>
          </div>
          <form id="modal-form">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group" style="grid-column:1/-1;">
                <label class="form-label">Product Name</label>
                <input class="form-input" id="f-name" type="text" placeholder="e.g. Brake Pad Set" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-input" id="f-category">
                  ${CATEGORIES.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Brand</label>
                <select class="form-input" id="f-brand">
                  ${BRANDS.map(b => `<option value="${b.brand_id}">${b.brand_name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Unit</label>
                <select class="form-input" id="f-unit">
                  ${UNITS.map(u => `<option value="${u.unit_id}">${u.unit_type}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Price (&#8369;)</label>
                <input class="form-input" id="f-price" type="number" min="0" step="0.01" placeholder="0.00" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input class="form-input" id="f-qty" type="number" min="0" placeholder="0" required/>
              </div>
              <div class="form-group">
                <label class="form-label">Reorder Level</label>
                <input class="form-input" id="f-reorder" type="number" min="0" placeholder="0" required/>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-red">Save Product</button>
            </div>
          </form>
        </div>
      </div>`;
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('modal-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        product_name:  document.getElementById('f-name').value.trim(),
        category_id:   parseInt(document.getElementById('f-category').value),
        brand_id:      parseInt(document.getElementById('f-brand').value),
        unit_id:       parseInt(document.getElementById('f-unit').value),
        price:         parseFloat(document.getElementById('f-price').value),
        quantity:      parseInt(document.getElementById('f-qty').value),
        reorder_level: parseInt(document.getElementById('f-reorder').value),
      };
      const { error } = await db.from('product').insert(payload);
      if (error) { showToast('Error saving product.', 'error'); return; }
      closeModal(); await loadProducts(); showToast(`"${payload.product_name}" added!`);
    });
  }

  // ── Render Shell ──────────────────────────────────────────────
  document.getElementById('app').innerHTML = `
    <div class="app">
      ${SIDEBAR}
      <main class="main">
        <div id="pageContent">
          <div class="page-header">
            <h1 class="page-title">Products</h1>
            <button class="btn btn-red" id="btn-add">+ Add Product</button>
          </div>
          <div class="toolbar" style="margin-bottom:16px;">
            <input class="search-input" id="search-products" type="text" placeholder="&#x1F50D; Search products..."/>
            <select class="filter-select" id="filter-category">
              <option value="">All Categories</option>
            </select>
            <select class="filter-select" id="filter-brand">
              <option value="">All Brands</option>
            </select>
            <span id="product-count" style="margin-left:auto;font-size:13px;color:var(--text-muted);font-weight:600;">Loading...</span>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Product Name</th><th>Category</th><th>Brand</th><th>Unit</th><th>Qty</th><th>Reorder Lvl</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody id="product-tbody"><tr><td colspan="10" class="td-muted" style="text-align:center;padding:32px;">Loading...</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
    <div id="modalSlot"></div>
    <div id="toast" class="toast"></div>
    <button class="fab-help" id="btn-help">?</button>`;

  await loadLookups();
  document.getElementById('filter-category').innerHTML = `<option value="">All Categories</option>${CATEGORIES.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('')}`;
  document.getElementById('filter-brand').innerHTML    = `<option value="">All Brands</option>${BRANDS.map(b => `<option value="${b.brand_id}">${b.brand_name}</option>`).join('')}`;

  await loadProducts();

  document.getElementById('btn-help').addEventListener('click', () => showToast('&#x1F4A1; Use the sidebar to navigate between modules.'));
  document.getElementById('btn-add').addEventListener('click', openAddModal);
  document.getElementById('search-products').addEventListener('input', applyFilters);
  document.getElementById('filter-category').addEventListener('change', applyFilters);
  document.getElementById('filter-brand').addEventListener('change', applyFilters);

})();